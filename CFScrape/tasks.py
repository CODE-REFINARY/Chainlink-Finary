from bs4 import BeautifulSoup
from django.core.mail import send_mail
import requests
from django.conf import settings
from celery import shared_task
import redis
from task_helper_functions import *


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

    listOfCruisesMissingNavJob = getListOfCruisesMissingNav.delay()
    listOfCruisesWithCtdProductButMissingRawJob = getListOfCruisesWithCTDProductButMissingRaw.delay()

    listOfCruisesMissingNavResult = listOfCruisesMissingNavJob.get()
    listOfCruisesWithCtdProductButMissingRawResult = listOfCruisesWithCtdProductButMissingRawJob.get()

    email_subject = "New Cruises That Need NAV"
    email_message = """The following is a list of new cruises that require NAV\n\n""" + ", ".join(sorted(new_cruise_ids_missing_nav))

    send_email(email_subject, email_message, ["gtdubinin@ucsd.edu"])

