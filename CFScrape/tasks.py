from bs4 import BeautifulSoup
from django.core.mail import send_mail
import requests
from django.conf import settings
from celery import shared_task
import redis


# redis_client = redis.from_url("redis://:123abc@172.17.0.1:6379")
redis_client = redis.from_url(settings.CELERY_BACKEND_URL)


@shared_task()
def scrape_breakout_page():
    # The purpose of this task is to scrape the R2R breakout page http://get.rvdata.us/breakout/?id=RC and
    # email gtdubinin@ucsd.edu indicating which cruises have filesets that have been released and are
    # pending bagging.
    scripps_cruises_breakout_list = [
        'http://get.rvdata.us/breakout/?id=SKQ',
        'http://get.rvdata.us/breakout/?id=RC',
        'http://get.rvdata.us/breakout/?id=TN',
        'http://get.rvdata.us/breakout/?id=HLY',
        'http://get.rvdata.us/breakout/?id=SR',
        'http://get.rvdata.us/breakout/?id=SP',
        'http://get.rvdata.us/breakout/?id=RR',
        'http://get.rvdata.us/breakout/?id=BH',
    ]

    # Running list of cruise_ids that have at least one released fileset
    cruise_ids = set()

    # loop through breakout pages for all Scripps vessels and check for released filesets in all of these
    for url in scripps_cruises_breakout_list:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')

        # Get all image elements that are grey (indicating the associated fileset is released).
        images = soup.find_all('img', src="/files/check_grey.jpg")
        for img in images:
            try:
                cruise_ids.add(img.parent.parent.parent.contents[1].get_text(strip=True))
            # As we go through the DOM we hit some elements that don't have children, but we expect this, so we just
            # ignore the exception as move to the next DOM element.
            except AttributeError:
                continue

    send_email("Released Cruise_id Roundup", "Cruise ID Roundup:\n\n" + ", ".join(sorted(cruise_ids)), ["gtdubinin@ucsd.edu"])


@shared_task()
def send_email(subject, message, recipient_list):
    send_mail(
        subject,
        message,
        'gtdubinin@gmail.com',  # From email
        recipient_list,
        fail_silently=False,
    )


@shared_task()
def getListOfOutstandingNav():
    """
    Get a list of all cruises that need to have R2R nav run.
    Get all RC cruises from API with https://service.rvdata.us/api/cruise/?vessel_shortname=Carson
    """


def getVesselShortnamesForAllActiveVessels():
    """
    Hit the R2R api and return a set containing the short names for all active vessels in R2R.
    """
    url = 'https://service.rvdata.us/api/vessel/'
    response = requests.get(url)
    data = response.json()["data"]
    name_set = set()
    for item in data:
        if item["is_active"]:
            name_set.add(item["short_name"])
    return name_set


# DEPRECATED
def checkIfCruisePageContainsNav(cruise_id):
    """
    This function returns True if there is at least one NAV device (GNSS or INS) listed on the cruise_page of the
    cruise page indicated by the argument. THIS DOESN'T WORK BECAUSE THE CRUISE PAGE IS NOT DESIGNED TO BE SCRAPEABLE
    """
    cruise_page_url = 'https://www.rvdata.us/search/cruise/' + cruise_id
    response = requests.get(cruise_page_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    # Check if the page contains at least one GNSS or INS device. If the number of these devices located is 0 (as in
    # none were found) then return false.
    return len(soup.find_all('td', string=lambda text: text and ('GNSS' in text or 'INS' in text))) != 0


def getListOfCruisesMissingNav():
    """
    Hit the R2R api and return a set of cruises that have no NAV product.
    """
    cruise_set = set()
    vessel_shortnames = getVesselShortnamesForAllActiveVessels()
    for name in vessel_shortnames:
        vessel_cruises_url = 'https://service.rvdata.us/api/cruise/?vessel_shortname=' + name
        response = requests.get(vessel_cruises_url)
        data = response.json()["data"]
        for cruise in data:
            # We want to definitely get all released cruises that still don't have NAV although this isn't the only
            # condition.
            if not cruise["has_r2rnav"] and cruise["release_option"] == "release_now":
                cruise_set.add(cruise["cruise_id"])
            # There is a possibility that the cruise has not yet been released but NAV data is ready to be processed. In
            # this case the only check is to visit the cruise page and check if a NAV product exists. This takes time
            # which is why this is not our first check.
            # TODO: implement this check
    return cruise_set


@shared_task()
def emailListOfNewCruisesMissingNav():
    """
    Send an email containing a list of cruises that are missing nav that haven't been
    """

    # Get the setwise difference between the set of all current cruises missing nav and the previously computed set
    # of all cruises missing nav (these previously computed cruise_ids are stored in the redis database).
    new_cruise_ids_missing_nav = getListOfCruisesMissingNav() - {item.decode('utf-8') for item in redis_client.smembers('cruises_missing_nav')}
    # Add all of these new cruise_ids to the redis database.
    for cruise_id in new_cruise_ids_missing_nav:
        redis_client.sadd('cruises_missing_nav', cruise_id)

    email_subject = "New Cruises That Need NAV"
    email_message = """The following is a list of new cruises that require NAV\n\n""" + ", ".join(sorted(new_cruise_ids_missing_nav))

    send_email(email_subject, email_message, ["gtdubinin@ucsd.edu"])

