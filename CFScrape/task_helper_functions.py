import datetime
import requests
from bs4 import BeautifulSoup
import redis
import json
from django.conf import settings
import logging
from celery import Celery

# Set up logging for diagnostics and debugging
logging.basicConfig(level=logging.DEBUG)

#redis_client = redis.from_url("redis://:123abc@172.17.0.1:6379")
redis_client = redis.from_url(settings.CELERY_BACKEND_URL)

sio_managed_vessel_shortnames = {"Thompson", "Healy", "Revelle", "Sproul", "Sally Ride", "Blue Heron", "Rachel Carson", "Sikuliaq"}
sio_managed_vessel_acronyms = {"TN", "HLY", "RR", "SP", "SR", "BH", "RC", "SKQ"}

# These are status that can be returned by getDeviceDataStatusForCruise which denote that the fileset exists.
file_exists_status_messages = ["hold", "pending", "published", "released", "ncei", "submitted_to_ncei"]


def refreshRedisBreakoutPages():
    """
    This function retrieves breakout pages for all cruises and stores them in the redis database so that they can
    be quickly accessed.
    """
    vessel_acronym_list = getVesselAcronymForAllVessels()
    for vessel in vessel_acronym_list:
        breakout_page_url = "http://get.rvdata.us/breakout/?id=" + vessel
        response = requests.get(breakout_page_url)

        redis_client.set(breakout_page_url, response.text)


def refreshRedisCruisePage():
    """
    This function retrieves the up-to-date listing of all cruise_ids from the R2R API and caches it in Redis under the
    url (Redis key = API url). To extract this value and store it as a DICT you need to JSON.loads() the result of this
    function. Then you should have a python dict.
    """
    url = 'https://service.rvdata.us/api/cruise/'
    response = requests.get(url)
    redis_client.set(url, response.text)


def refreshRedisVesselPage():
    """
    This function retrieves the up-to-date listing of all vessels from the R2R API and caches it in Redis under the
    url (Redis key = API url). To extract this value and store it as a DICT you need to JSON.loads() the result of this
    function. Then you should have a python dict.
    """
    url = 'https://service.rvdata.us/api/vessel/'
    response = requests.get(url)
    redis_client.set(url, response.text)


def refreshRedisCtdProductPage():
    """
    This function retrieves the up-to-date listing of all vessels from the R2R API and caches it in Redis under the
    url (Redis key = API url). To extract this value and store it as a DICT you need to JSON.loads() the result of this
    function. Then you should have a python dict.
    """
    url = 'https://service.rvdata.us/api/product/product_type/r2rctd'
    response = requests.get(url)
    redis_client.set(url, response.text)


def getListOfCruisesMissingNav():
    """
    Hit the R2R api and return a set of cruises that have no NAV product.
    """
    cruise_set = set()
    # These two sets below allow us to keep track of which vessels do not have gnss and/or gnss devices so that we
    # don't have to perform lots of extra manual checks.
    vessels_without_gnss = set()
    vessels_without_ins = set()
    vessels_without_breakout_page = set()
    vessel_dict = getVesselDict()

    cruise_ids_present_on_a_breakout_page = getListOfAllCruiseIdsFeaturedOnABreakoutPage()

    #TODO: define a dict that's a subset of getCruiseDict() except only with cruise_ids that are known to be in
    # breakout pages
    for cruise_id, cruise_dict in getCruiseDict().items():
        try:
            cruise_vessel = vessel_dict[cruise_dict["vessel_id"]]

        # We want to catch errors where a vessel that's associated to a cruise isn't listed in the vessel API endpoint.
        # this does happen for some cruises.
        except KeyError:
            logging.debug("Vessel Entry: '" + cruise_dict["vessel_id"] + "' was not found in /api/vessel.")
        # Check if the vessel associated with this cruise is active. If it isn't then don't bother checking the cruise.

        # We don't run nav for certain vessels vessels
        if cruise_vessel in ['Nautilus', 'Nathaniel B. Palmer', 'Corwith Cramer', 'Robert C. Seamans', 'Townsend Cromwell', 'Laurence M. Gould', 'Robert D. Conrad', 'Ronald H. Brown']:
            continue

        # Skip a cruise if it's not present on any breakout page because then we can't verify if it has any nav data.
        if cruise_id not in cruise_ids_present_on_a_breakout_page:
            continue

        if cruise_vessel["is_active"]:
            # We want to definitely get all released cruises that still don't have NAV although this isn't the only
            # condition.
            if not cruise_dict["has_r2rnav"] and cruise_dict["release_option"] == "release_now":
                cruise_set.add(cruise_id)
                continue
            # There is a possibility that the cruise has not yet been released but NAV data is ready to be processed. In
            # this case the only check is to check the breakout page for if NAV filesets exist. If NAV filesets exist
            # then nav should be run (even if the cruise isn't yet released).
            if not cruise_dict["vessel_id"] in vessels_without_ins:
                if not cruise_dict["vessel_id"] in vessels_without_breakout_page:
                    ins_data_status = getDeviceDataStatusForCruise(cruise_id, "ins")
                    if ins_data_status == "vessel_doesnt_have_device":
                        vessels_without_ins.add(cruise_dict["vessel_id"])
                    if ins_data_status == "vessel_missing_breakout_page":
                        vessels_without_breakout_page.add(cruise_dict["vessel_id"])
                    elif ins_data_status in file_exists_status_messages and not cruise_dict["has_r2rnav"]:
                        print("Adding " + cruise_id)
                        cruise_set.add(cruise_id)

            if not cruise_dict["vessel_id"] in vessels_without_gnss:
                if not cruise_dict["vessel_id"] in vessels_without_breakout_page:
                    gnss_data_status = getDeviceDataStatusForCruise(cruise_id, "gnss")
                    if gnss_data_status == "vessel_doesnt_have_device":
                        vessels_without_gnss.add(cruise_dict["vessel_id"])
                    if gnss_data_status == "vessel_missing_breakout_page":
                        vessels_without_breakout_page.add(cruise_dict["vessel_id"])
                    elif gnss_data_status in file_exists_status_messages and not cruise_dict["has_r2rnav"]:
                        print("Adding " + cruise_id)
                        cruise_set.add(cruise_id)
    return cruise_set


#@app.task
def getListOfCruisesWithCTDProductButMissingRaw():
    """
    This function returns a python set of cruise ids that have unpublished CTD but that also have a CTD product.
    """
    # This is the set of cruises that, according to the API, have CTD products
    cruises_with_ctd_dict = getCtdProductDict()
    cruise_ids_present_on_a_breakout_page = getListOfAllCruiseIdsFeaturedOnABreakoutPage()
    # This is the set we will be adding to and ultimately return
    cruise_ids_without_published_ctd = set()
    # For every SIO-managed vessel we will get a list of cruise ids that have released but unpublished CTD using the
    # breakout page, and then we'll determine if these each of these cruise ids has a CTD product by checking the R2R
    # api endpoint: https://service.rvdata.us/api/product/cruise_id/AE0903&product_type=r2rctd
    for cruise_id in getAllSioCruiseIds():
        # Skip a cruise if it's not present on any breakout page because then we can't verify if it has any nav data.
        if cruise_id not in cruise_ids_present_on_a_breakout_page:
            continue
        if getDeviceDataStatusForCruise(cruise_id, "ctd") == "released":
            if cruise_id in cruises_with_ctd_dict:
                cruise_ids_without_published_ctd.add(cruise_id)
    return cruise_ids_without_published_ctd


#@app.task
def getVesselShortnamesForAllActiveVessels(refresh_redis=False):
    """
    Hit the R2R api and return a set containing the short names for all active vessels in R2R.
    """
    url = 'https://service.rvdata.us/api/vessel/'
    if not redis_client.get(url) or refresh_redis:
        refreshRedisVesselPage()
    data = json.loads(redis_client.get(url))["data"]
    name_set = set()
    for item in data:
        if item["is_active"]:
            name_set.add(item["shortname"])
    return name_set


def getVesselAcronymForAllVessels(refresh_redis=False):
    url = 'https://service.rvdata.us/api/vessel/'
    if not redis_client.get(url) or refresh_redis:
        refreshRedisVesselPage()
    data = json.loads(redis_client.get(url))["data"]
    name_set = set()
    for item in data:
        if item["is_active"]:
            name_set.add(item["prefix"])
    return name_set


def getVesselAcronymForAllSIOManagedVessels(refresh_redis=False):
    url = 'https://service.rvdata.us/api/vessel/'
    if not redis_client.get(url) or refresh_redis:
        refreshRedisVesselPage()
    data = json.loads(redis_client.get(url))["data"]
    name_set = set()
    for item in data:
        if item["is_active"] and item["prefix"] in sio_managed_vessel_acronyms:
            name_set.add(item["prefix"])
    return name_set


def getVesselAcronymFromId(cruise_id, refresh_redis=False):
    url = "https://service.rvdata.us/api/cruise/"
    if not redis_client.get(url) or refresh_redis:
        refreshRedisCruisePage()
    # Retrieve the serialized JSON from Redis and deserialize into a python str
    try:
        return getCruiseDict()[cruise_id]["vessel_acronym"]
    except KeyError:
        logging.debug("cruise_id '" + cruise_id + "' was not found in the cruise API.")


def getCruiseDict():
    """
    This function will return a dictionary containing all cruises by grabbing the cruise list from Redis (and then the
    API if it's missing in Redis) and then converting the contents into a python dictionary where the top level keys
    are cruise ids and the values are dictionaries containing all fields for that cruise id that you would expect.
    """
    cruise_dict = {}
    url = "https://service.rvdata.us/api/cruise/"
    if not redis_client.get(url):
        refreshRedisCruisePage()
    # Retrieve the serialized JSON from Redis and deserialize into a python str
    data_list = json.loads(redis_client.get(url))["data"]
    for cruise in data_list:
        # json.loads will return the redis information as a list so we want to convert it to dict so we can index it
        cruise_as_dict = dict(cruise)
        # construct a key/value pair out of information from this entry of the list. The key is the cruise id, the value
        # is the entire JSON substructure as a python dict.
        cruise_dict[cruise_as_dict["cruise_id"]] = cruise_as_dict
    return cruise_dict


def getVesselDict():
    """
    This function will return a dictionary containing all cruises by grabbing the cruise list from Redis (and then the
    API if it's missing in Redis) and then converting the contents into a python dictionary where the top level keys
    are cruise ids and the values are dictionaries containing all fields for that cruise id that you would expect.
    """
    vessel_dict = {}
    url = "https://service.rvdata.us/api/vessel/"
    if not redis_client.get(url):
        refreshRedisVesselPage()
    # Retrieve the serialized JSON from Redis and deserialize into a python str
    data_list = json.loads(redis_client.get(url))["data"]
    for vessel in data_list:
        # json.loads will return the redis information as a list so we want to convert it to dict so we can index it
        vessel_as_dict = dict(vessel)
        # construct a key/value pair out of information from this entry of the list. The key is the vessel id, the value
        # is the entire JSON substructure as a python dict.
        vessel_dict[vessel_as_dict["id"]] = vessel_as_dict
    return vessel_dict


def getCtdProductDict():
    ctd_dict = {}
    url = "https://service.rvdata.us/api/product/product_type/r2rctd"
    if not redis_client.get(url):
        refreshRedisCtdProductPage()
    # Retrieve the serialized JSON from Redis and deserialize into a python str
    data_list = json.loads(redis_client.get(url))["data"]
    for product in data_list:
        # json.loads will return the redis information as a list so we want to convert it to dict so we can index it
        ctd_product_as_dict = dict(product)
        # construct a key/value pair out of information from this entry of the list. The key is the vessel id, the value
        # is the entire JSON substructure as a python dict.
        ctd_dict[ctd_product_as_dict["cruise_id"]] = ctd_product_as_dict
    return ctd_dict


def getAllSioCruiseIds(refresh_redis=False):
    url = "https://service.rvdata.us/api/cruise/"
    sio_cruises = set()
    if not redis_client.get(url) or refresh_redis:
        refreshRedisCruisePage()
    # Retrieve the serialized JSON from Redis and deserialize into a python str
    data_list = json.loads(redis_client.get(url))["data"]
    for id in sio_managed_vessel_acronyms:
        for cruise in data_list:
            cruise_dict = dict(cruise)
            if cruise_dict.get('vessel_acronym') == id:
                sio_cruises.add(cruise_dict.get('cruise_id'))
    return sio_cruises



def getListOfAllCruiseIdsFeaturedOnABreakoutPage(sio_only=False):
    """
    This function expects a vessel acronym and returns a list of cruise_ids that match that vessel acronym that are
    listed on the breakout page for that vessel.
    """
    link_texts = set()
    if sio_only:
        vesselAcronyms = getVesselAcronymForAllSIOManagedVessels()
    else:
        vesselAcronyms = getVesselAcronymForAllVessels(refresh_redis=False)
    for vessel_acronym in vesselAcronyms:
        breakout_page_url = "http://get.rvdata.us/breakout/?id=" + vessel_acronym
        if not redis_client.get(breakout_page_url):
            logging.debug("""A matching breakout page was not found for """ + cruise_id + ".")
            return None

        response = redis_client.get(breakout_page_url).decode('utf-8')
        soup = BeautifulSoup(response, 'html.parser')

        # Find all <tr> elements
        trs = soup.find_all('tr')

        # Extract the text from all <a> elements in the first <td> of each <tr>
        for tr in trs:
            first_td = tr.find('td')  # Find the first <td> in each <tr>
            if first_td:
                a_tag = first_td.find('a')  # Find the <a> inside the first <td>
                if a_tag:
                    link_texts.add(a_tag.text.strip())  # Append the text of the <a> tag

    return link_texts



def getDeviceDataStatusForCruise(cruise_id, device):
    """
    This function excepts two arguments: a cruise_id and a device. This function uses these two arguments to determine
    if data for that cruise_id for that device is either missing, unpublished, published, or frozen.
    """
    # Grab the contents of the breakout page. This is our source, and we get it using the cruise_id's vessel's
    # shortname.
    breakout_page_url = "http://get.rvdata.us/breakout/?id=" + getVesselAcronymFromId(cruise_id)
    # Not all vessels have a breakout page. If there isn't one then there's not much we can do about that.
    if not redis_client.get(breakout_page_url):
        logging.debug("""A matching breakout page was not found for """ + cruise_id + ".")
        return "vessel_missing_breakout_page"

    response = redis_client.get(breakout_page_url).decode('utf-8')
    soup = BeautifulSoup(response, 'html.parser')
    # Get the overall table
    table = soup.find('table')
    # Get the first occurrence of a <tr>. This will be the row containing the device names.
    first_row = table.find('tr')
    # Save the names of all columns (which are device names) in a python list.
    devices = [a.get('title') for a in first_row.find_all('a')]
    try:
        device_idx = devices.index(device)
    except ValueError:
        logging.debug("Device '" + device + "' isn't onboard for '" + cruise_id + "'")
        return "vessel_doesnt_have_device"
    try:
        table_row_parent = table.find_all(lambda tag: tag.name == "a" and cruise_id in tag.text)[0].parent.parent
    except IndexError:
        logging.debug("""getDeviceDataStatusForCruise was called for """ + cruise_id + """ but this cruise wasn't found
        listed on the breakout page.""")
        return "cruise_missing"
    table_row_children = table_row_parent.find_all(recursive=False)
    target_cell_container = table_row_children[device_idx + 1].find('a')
    if not target_cell_container:
        return "empty"
    elif target_cell_container.find('img', {'src': '/files/hold.jpg'}):
        return "hold"
    elif target_cell_container.find('img', {'src': '/files/pending.jpg'}):
        return "pending"
    elif target_cell_container.find('img', {'src': '/files/r2r.jpg'}):
        return "published"
    elif target_cell_container.find('img', {'src': '/files/check_grey.jpg'}):
        return "released"
    elif target_cell_container.find('img', {'src': '/files/noaa.jpg'}):
        return "ncei"
    elif target_cell_container.find('img', {'src': '/files/x.png'}):
        return "dont_show"
    elif target_cell_container.find('img', {'src': '/files/check.jpg'}):
        return "submitted_to_ncei"
    else:
        raise Exception("Cruise status not recognized.")


