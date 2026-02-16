from django.http import HttpResponse, Http404, HttpRequest
from django.shortcuts import render, get_object_or_404
from .models import *
from django.views.decorators.cache import cache_control
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login as backend_login, logout as backend_logout
from decouple import Config  # This library parses .env files
from pathlib import Path  # This function defines a file path
import os
from django.utils import timezone
import random  # use this to generate unique titles for fence and/or chainlink
import json  # use this to parse JSON payloads in HTTP requests
import hashlib  # use this to generate hashes for urls
from decouple import config
from django.conf import settings  # Get variables defined in settings.py
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from django.urls import reverse
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl
from datetime import datetime
from django.core.exceptions import ValidationError, FieldDoesNotExist
from django.db import models


class HttpRequestWrapper(HttpRequest):
    def __init__(self, body_data, user_data, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._body_data = body_data
        self._user_data = user_data

    @property
    def body(self):
        return self._body_data

    @property
    def user(self):
        return self._user_data

    ###################### database accessors ######################


def db_store(payload, collection, is_landing_page=False, user=None):
    """
    Write data to the database. Call this function from an HTTP POST for non-idempotent data store.
    :param payload: JSON payload specifying the properties of the Element to write to the database
    :param is_landing_page: This boolean flag indicates whether this page should be set as the landing page for the site. If this flag is set then the LANDING_PAGE_URL global variable is set equal to the generated url for the page
    :param collection (optional): String indicating the url of the collection object of the Element to store. Body uses the url of its Chainlink and thus this parameter is not needed for elements of type Body. In this case, this parameter is only used if no URL is specified in the JSON payload.
    :param user: The user object indicates the currently logged in user. This argument is used to set the landing page field for the logged in user if the is_landing_page parameter is set to True
    """
    # Parse the stringified json in the argument so that the payload can be read and written to the database
    json_data = json.loads(payload)
    # Read the type of Element to store
    tag = TagType(json_data["tag"])
    collection = Collection.objects.get(url=collection)

    if tag == TagType.HEADER2:
        # Create a representation of the Chainlink object to write to the database
        el = Header2()
        # Update the collection object to indicate that it has a new child

    if tag == TagType.HEADER1:
        el = Header1()

    if tag == TagType.HEADER3:
        el = Header1()

    if tag == TagType.PARAGRAPH:
        el = Header1()

    if tag == TagType.LINEBREAK:
        el = Linebreak()

    if tag == TagType.CODE:
        el = Code()
        
    # The url that we'll receive from the front-end will be empty.
    # We find a unique url for this new element and send it back to
    # the frontend for it to update itself with it.
    json_data["url"] = db_generate_unique_url()
    el.url = json_data["url"]

    el.collection = collection

    if json_data["order"]:
        el.order = json_data["order"]

    if json_data["text"]:
        el.text = json_data["text"]
        
    if json_data["public"]:
        el.public = json_data["public"]

    if json_data["archive"]:
        el.archive = json_data["archive"]

    if json_data["css"]:
        el.css = json_data["css"]

    if json_data["date"]:
        try:
            el.date = json_data["date"]
        except ValueError:
            el.date = timezone.now()

    # write objects to the database
    el.save()

    """
    elif tag == TagType.COLLECTION:
        # Create a representation of the Article as a python object
        collection = Collection()
        collection.url = db_try_url(TagType.HEADER1)  # Get a unique url for this collection.
        collection.public = False
        collection.date = timezone.now()

        # Write Python Article object to database
        collection.save()

        # If the landing page flag is set then also write the generated url to the LANDING_PAGE_URL field of the .env
        # file
        if is_landing_page:
            logged_in_user = Account.objects.get(user=user)
            #logged_in_user.landing_page_url = collection.url <-- this line should probalby be removed. It's here just for easy revision
            loggin_in_user.landing_page_collection = collection
            logged_in_user.save()

        # Set the url field now that we've assigned a url so that frontend can redirect the user to this new collection.
        json_data["url"] = collection.url
    """

    # Return the JSON payload back to be sent as an HTTP response back to the user. We do this so that we can
    # communicate to the front-end any adjustments or system updates pertinent to the user's request back to them
    # (for example send back the url we construct for their collection so that the front-end can redirect their browser
    # to this new url).
    return json.dumps(json_data)


def db_remove(tag, url, order):
    """
    Delete data from the database.
    """
    target = Element.objects.get(url=url)
    target.delete()

def db_update(payload):
    """
    Alter the contents of a database item

    :param table: identify table holding the target
    :param url: url string identifying target item
    :param order: item identifier used in tandem with url to identify Body type targets
    :param payload: string indicating changes to make to target item
    """
    change_list = json.loads(payload)
    url = change_list["url"]  # Every Element update request must have a url so that we can identify the correct Element parent object
    target = Element.objects.get(url=url).content  # Get the record that we want to modify.
    print(target)
    print(payload)
    for change in change_list:
        key = change
        value = change_list[key]
        if hasattr(target, key):
            try:
                value = cast_value(target._meta.get_field(key), value)
                print(type(value))
                print(value==True)
                setattr(target, key, value)
                target.save()
            except ValidationError:
                print("Validation Error: Trying to set attribute `" + key + "` of object tag type `" + target.tag + "` but that attribute isn't defined for that object type.")
            except FieldDoesNotExist:
                print("FieldDoesNotExistError: Trying to set attribute `" + key + "` of object tag type `" + target.tag + "` but that attribute isn't defined for that object type.")


def db_try_title(table, try_title):
    """
    Validate text name input for uniqueness and return unique alternative if needed

    :param table: table within which newly text object resides
    :param try_title: text string to validate for uniqueness
    """
    while table.objects.filter(text=try_title).exists() or try_title == '':
        try_title += "+"
    return try_title


def db_generate_unique_url():
    """
    Generate a unique url for specified record type

    :param tag_type: type of record this url will be used for
    :param check_url: This string is a url that's checked. If the url is tied to a record then a new url is generated and returned. Otherwise this argument is returned.
    """
    try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()[:10]
    while Element.objects.filter(url=try_url).exists():
        try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()[:10]
    return try_url


def db_check_url(tag_type, check_url):
    """
    Determine if the parameter url exists in the database as a url attached to record of type tag_type

    :param tag_type: type of record this url will be used for
    :param check_url: This string is a url that's checked. If the url is tied to a record then return True. Otherwise return False
    """
    if TagType.HEADER1:
        matching_record = Collection.objects.filter(url=check_url)
    elif TagType.CHAINLINK:
        matching_record = Chainlink.objects.filter(url=check_url)
    return matching_record.exists()


###################### View Methods ######################

# force collection list page to not get cached so that changes from chainlink pages show up on browser back button
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def generic(request, url=None):
    """
    This is the big view. The one that all Collection urls call. Maybe I would want to call this view "Collection"
    instead... Oh well.The url parameter is how you specify which collection to grab.
    """
    if not request.user.is_authenticated:
        pass

    if url is None:
        raise ValueError("A null key and null url value were both supplied to the generic view. At least one of these values must be populated")

    if request.method == "GET":
        # Get this collection from the database and return a 404 if it isn"t found
        collection = get_object_or_404(Collection, url=url)
        if not request.user.is_authenticated and not collection.public:
            return render(request, "Patchwork/failure.html");

        # If the user is logged in then display all the Collections.
        if request.user.is_authenticated:
            collections = Collection.objects.all()
        else:
            # Otherwise just display the Collections that are marked public.
            collections = Collection.objects.filter(public=True)

        # Get the query string edit argument from the url. This argument gets passed to the template so that the
        # template knows to render in edit mode.
        edit = request.GET.get('edit', 'false')

        # Chainlink and Body data to be passed into the template takes the following form:
        # (chainlink_object, [child_element_object1, child_element_object2, ...])
        elements = []
        # Populate the above list with tuples of the specified form by first getting the list of all Chainlinks that
        # are attached to this Article.
        for element in Element.objects.filter(collection=collection.pk).order_by("order"):
            elements.append(element)

        return render(request, "Patchwork/generic.html", {
            "collections": collections,
            "elements": elements,
            "collection": collection,
            "edit": edit,
            "view": "generic"
        })

    elif request.method == "POST":
        # Call auxiliary function to write the Element specified as JSON in the request object
        # The request payload contains JSON specifying the properties of the Element to write to the database
        payload = request.body
        # db_store returns this payload argument back with any modifications that were made (such as a url being
        # updated for example)
        payload = db_store(payload, url)
        # The server response is the payload itself
        return HttpResponse(payload, content_type="application/json")

    elif request.method == "DELETE":
        payload = request.body
        payload_json = json.loads(payload)
        url = payload_json["url"]
        order = payload_json["order"]
        tag = TagType(payload_json["tag"])
        db_remove(tag, url, order)

    elif request.method == "PUT":
        #target_id = request.headers["url"]
        #target_update = request.headers["payload"]
        payload = request.body
        db_update(payload)
        """
        elif inheritsBody(Tag):
            db_update(Body, payload_json["url"], payload_json["order"], payload)
        elif inheritsHeader(Tag):
            db_update(Header, payload_json["url"], payload_json["order"], payload)
        elif inheritsFooter(Tag):
            db_update(Footer, payload_json["url"], payload_json["order"], payload)
        """

    return render(request, "Patchwork/index.html", {})


# def generate(request, is_landing_page, user=None):
@login_required
def generate(request):
    """
    Create an Article. Write the collection to the database and communicate back any updates to the specified collection properties by returning the updated properties as JSON.

    :param request: http request object. The payload is the set of poperties for the Article.
    <DEPRECATED> :param is_landing_page: this boolean flag indicates that the created Collection should be set as the landing page for the website
    """
    if request.method == "POST":
        return aux_generate(request, False, None)


def index(request):
    collections = Collection.objects.filter(public=True).order_by("date")
    return render(request, "Patchwork/index.html", {"collections": collections, "view": "index"})

def automations(request):
    """
    This is a static page that displays interesting (hopefully) information about the automated processes that the
    web server runs.
    """
    return render(request, "Patchwork/automations.html", {"view": "automations"})


@login_required
def profile(request):
    """
    Take the user to the configured landing page for the application. If no such page exists then generate a new one
    and display an explanatory welcome page for the user.
    """
    # Determine if a landing page exists and send the user to the landing page if it does
    if not request.user.is_authenticated:
        return login(request)
    if db_check_url(Collection, Account.objects.get(user=request.user).landing_page_collection.url):
       return generic(request, url=Account.objects.get(user=request.user).landing_page_collection.url)

    # Otherwise generate a new landing page for the site and then direct the user to an informational static page
    else:
        post_request_payload = {
            "type": "header",
            "text": "Landing Page",
            "public": True,
            "date": str(timezone.now())
        }
        post_request = HttpRequestWrapper(json.dumps(post_request_payload), request.user)
        post_request.method = "POST"
        return aux_generate(post_request, True, request.user)


def login(request):
    if request.method == 'POST':
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        referer = request.META.get('HTTP_REFERER', '/')
        if user is not None:
            backend_login(request, user)
            query_params = {'login_successful': 'true'}
        else:
            query_params = {'login_successful': 'false'}

        # Parse the referer URL
        url_parts = list(urlparse(referer))

        # Combine the existing query params with the new ones
        query = dict(parse_qsl(url_parts[4]))
        query.update(query_params)

        # Update the query part of the URL
        url_parts[4] = urlencode(query)

        # Construct the new URL
        new_url = urlunparse(url_parts)

        return HttpResponseRedirect(new_url)


def logout(request):
    if request.method == "POST":
        backend_logout(request)
        referer = request.META.get('HTTP_REFERER', '/')

        # Define your query parameters as a dictionary
        query_params = {'logout_successful': 'true'}

        # Parse the referer URL
        url_parts = list(urlparse(referer))

        # Combine the existing query params with the new ones
        query = dict(parse_qsl(url_parts[4]))
        query.update(query_params)

        # Update the query part of the URL
        url_parts[4] = urlencode(query)

        # Construct the new URL
        new_url = urlunparse(url_parts)

        return HttpResponseRedirect(new_url)


def about(request):
    return render(request, 'Patchwork/about.html', {"view": "about"})


def react(request):
    return render(request, 'Patchwork/react.html', {})


###################### Helper Methods ######################

def aux_generate(request, is_landing_page, user=None):
    """
    Create a new collection. If the newly created collection should be a landing page send back a static information page. Otherwise send a simple HttpResponse

    :param request: http request object. The payload is the set of properties for the Article.
    :param is_landing_page: this boolean flag indicates that the created Collection should be set as the landing page for the website.
    :param user: this is the user object corresponding to the currently logged-in user. The landing page will be set for this user.
    """
    # Create a new collection and write it to the database. The payload variable will contain the url for the collection
    payload = json.dumps({"type": "Collection"})
    payload = db_store(payload, None, is_landing_page, user)
    if not is_landing_page:
        url = reverse("collection", kwargs={"url": json.loads(payload)["url"]})
        return redirect(url)
    else:
        return render(request, 'Patchwork/new_landing_page.html', {})


def validate_and_return_count(element):
    """
    Validate the Element is defined correctly. If not then fix the issue quietly. Return its child Element count
    regardless.
    :param element: - This is an Element to be validated
    :return: - This function returns an int equal to the number of child elements of `element`.
    """
    if element._meta.object_name == "Chainlink":
        return Body.objects.filter(chainlink=element).count()

    elif element._meta.object_name == "Collection":
        return Chainlink.objects.filter(collection=element).count()


def cast_value(field, value):
    """
    Attempts to cast a value to the correct type based on the field's class.
    """
    field_type = type(field)
    print("------")
    print(field)
    print(value)

    try:
        if field_type == models.CharField:
            # Cast to string for CharField
            return str(value)
        elif field_type == models.IntegerField:
            # Cast to integer for IntegerField
            return int(value)
        elif field_type == models.FloatField:
            # Cast to float for FloatField
            return float(value)
        elif field_type == models.BooleanField:
            # Cast to boolean for BooleanField
            if value == "False":
                return False
            elif value == "True":
                return True
            elif isinstance(value, bool):
                return value
            else:
                raise ValueError("Invalid boolean value. The `value` argument must be either a str value of 'True' or 'False' or a boolean value.")
        elif field_type == models.DateTimeField:
            # Attempt to parse datetime for DateTimeField
            if isinstance(value, str):
                return datetime.fromisoformat(value)
            return value
        elif field_type == models.DateField:
            # Attempt to parse date for DateField
            if isinstance(value, str):
                return datetime.strptime(value, '%Y-%m-%d').date()
            return value
        # Add more cases as needed for other field types...
        else:
            # Return the value as-is if no matching type
            return value
    except (ValueError, TypeError) as e:
        # Log or raise error if casting fails
        raise ValidationError(f"Failed to cast value '{value}' to {field_type.__name__}: {e}")