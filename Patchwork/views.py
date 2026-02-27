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
from django.utils.text import slugify
import html
from django.core.validators import URLValidator
import bleach


###################### Helper Methods ######################

def secure_validate_input(raw_value, max_length=20000, is_url_component=False):
    """
    Validates input: allows safe HTML, blocks scripts/styles, and handles slugs.
    """
    if not raw_value or not isinstance(raw_value, str):
        return None, "Input is empty or invalid"

    # 1. HTML Sanitization (The "Bleach" Step)
    # Define which tags and attributes you consider "safe"
    allowed_tags = ['b', 'i', 'u', 'em', 'strong', 'p', 'br', 'a', 'ul', 'li']
    allowed_attrs = {
        'a': ['href', 'title', 'target'], # Allow links but only specific attributes
    }

    # This removes <script>, <style>, <iframe) and strips "onmouseover" etc.
    cleaned = bleach.clean(
        raw_value.strip(), 
        tags=allowed_tags, 
        attributes=allowed_attrs,
        strip=True # If False, it escapes the bad tags; if True, it deletes them.
    )

    # 2. Length Enforcement (Higher limit for HTML)
    if len(cleaned) > max_length:
        return None, f"Input too long (max {max_length})"

    # 3. URL/Slug Logic (STILL ESCAPE/STRIP HTML HERE)
    if is_url_component:
        # For a URL, we don't want ANY HTML, so we strip tags entirely
        url_safe = bleach.clean(cleaned, tags=[], strip=True) 
        cleaned = slugify(url_safe)
        if not cleaned:
            return None, "Invalid URL characters"

    return cleaned, None


def cast_value(field, value):
    """
    Attempts to cast a value to the correct type based on the field's class.
    """
    field_type = type(field)

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


def db_store(payload, collection):
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

    if tag == TagType.COLLECTION:
        el = Collection()
        if json_data.get("public") is not None:
            el.public = json_data.get("public")
        if json_data.get("title") is not None:
            sanitized_title = secure_validate_input(json_data.get("title"))[0]
            try:
                Collection.objects.get(title=sanitized_title)
                # If we get here, it means a record WAS found
                return HttpResponse("title_not_unique", status=422)
            except Collection.DoesNotExist:
                # This is actually the "success" path where the title is unique
                pass
            el.title = sanitized_title
            
        if json_data.get("url") is not None:
            # 1. Get and Sanitize the data
            raw_url = json_data.get("url", "").strip()
            sanitized_url = secure_validate_input(raw_url, 120, True)[0]

            # If it's a slug (part of a URL), slugify it to remove spaces/special chars
            # If it's a full domain, you might skip slugify but still strip()
            clean_url = slugify(sanitized_url) 

            if not clean_url:
                return HttpResponse("invalid_url_format", status=422)

            # 2. Check Uniqueness (using .exists() is cleaner than try/except)
            if Collection.objects.filter(url=clean_url).exists():
                return HttpResponse("url_not_unique", status=422)
            
            el.url = clean_url

        if json_data.get("css") is not None:
            sanitized_css = secure_validate_input(json_data.get("css"))[0]
            el.css = json_data.get("css")

        # Date handling with a fallback
        raw_date = json_data.get("date")
        if raw_date:
            try:
                el.date = raw_date
            except (ValueError, TypeError):
                el.date = timezone.now()
        else:
            el.date = timezone.now()

        el.save()

    else:
        collection = Collection.objects.get(url=collection)

        if tag == TagType.HEADER1:
            el = Header1()

        if tag == TagType.HEADER2:
            # Create a representation of the Chainlink object to write to the database
            el = Header2()
            # Update the collection object to indicate that it has a new child

        if tag == TagType.HEADER3:
            el = Header3()

        if tag == TagType.PARAGRAPH:
            el = Paragraph()

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

        # Use .get() to safely check for keys
        if json_data.get("order") is not None:
            el.order = json_data["order"]

        if json_data.get("text"):
            el.text = secure_validate_input(json_data["text"])[0]
            
        if json_data.get("public") is not None:
            el.public = json_data["public"]

        if json_data.get("archive") is not None:
            el.archive = json_data["archive"]

        if json_data.get("css"):
            el.css = secure_validate_input(json_data["css"])[0]

        # Date handling with a fallback
        raw_date = json_data.get("date")
        if raw_date:
            try:
                el.date = raw_date
            except (ValueError, TypeError):
                el.date = timezone.now()
        else:
            el.date = timezone.now()

        # write objects to the database
        el.save()

    # Return the JSON payload back to be sent as an HTTP response back to the user. We do this so that we can
    # communicate to the front-end any adjustments or system updates pertinent to the user's request back to them
    # (for example send back the url we construct for their collection so that the front-end can redirect their browser
    # to this new url).
    return json.dumps(json_data)


def db_remove(payload, collection):
    """
    Delete data from the database.
    """
    json_data = json.loads(payload)
    # Read the type of Element to store
    tag = TagType(json_data["tag"])

    if tag == TagType.COLLECTION:
        target = Collection.objects.get(url=collection)
    else:
        target = Element.objects.get(url=json_data["url"])
    
    target.delete()


def db_update(payload, url):
    
    json_data = json.loads(payload)
    tag = TagType(json_data["tag"])

    if tag == TagType.COLLECTION:
        target = Collection.objects.get(url=url)

    else:
        url = json_data["url"]  # Every Element update request must have a url so that we can identify the correct Element parent object
        target = Element.objects.get(url=url).content  # Get the record that we want to modify.

    for change in json_data:
        key = change
        value = json_data[key]

        if hasattr(target, key):
            try:
                if type(target._meta.get_field(key)) == models.CharField:
                    value_sanitized = secure_validate_input(value)[0]
                elif type(target._meta.get_field(key)) == models.SlugField:
                    value_sanitized = secure_validate_input(value, 120, True)[0]
                else:
                    value_sanitized = value

                value_sanitized = cast_value(target._meta.get_field(key), value_sanitized)
                setattr(target, key, value_sanitized)
                target.save()
            except ValidationError:
                print("Validation Error: Trying to set attribute `" + key + "` of object tag type `" + target.tag + "` but that attribute isn't defined for that object type.")
            except FieldDoesNotExist:
                print("FieldDoesNotExistError: Trying to set attribute `" + key + "` of object tag type `" + target.tag + "` but that attribute isn't defined for that object type.")


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
        db_remove(payload, url)

    elif request.method == "PUT":
        payload = request.body
        db_update(payload, url)

    return render(request, "Patchwork/index.html", {})


def index(request):
    collections = Collection.objects.filter(public=True).order_by("date")
    return render(request, "Patchwork/index.html", {"collections": collections, "view": "index"})


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

