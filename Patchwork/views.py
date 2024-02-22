from django.http import HttpResponse, Http404, HttpRequest
from django.shortcuts import render, get_object_or_404
from .models import Chainlink, Collection, Content, TagType, Account, Header
from django.views.decorators.cache import cache_control

from decouple import Config  # This library parses .env files
from pathlib import Path  # This function defines a file path
import os

from django.utils import timezone
from .models import TagType  # enum type for types text/chainlink type(s)
import random  # use this to generate unique titles for fence and/or chainlink
import json  # use this to parse JSON payloads in HTTP requests
import hashlib  # use this to generate hashes for urls
from django.conf import settings
from decouple import config


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


def db_store(payload, parent, is_landing_page=False, user=None):
    """
    Write data to the database. Call this function from an HTTP POST for non-idempotent data store.
    :param payload: JSON payload specifying the properties of the Element to write to the database
    :param is_landing_page: This boolean flag indicates whether this page should be set as the landing page for the site. If this flag is set then the LANDING_PAGE_URL global variable is set equal to the generated url for the page
    :param parent (optional): String indicating the url of the parent object of the Element to store. Content uses the url of its Chainlink and thus this parameter is not needed for elements of type Content. In this case, this parameter is only used if no URL is specified in the JSON payload.
    :param user: The user object indicates the currently logged in user. This argument is used to set the landing page field for the logged in user if the is_landing_page parameter is set to True
    """
    # Parse the stringified json in the argument so that the payload can be read and written to the database
    json_data = json.loads(payload)
    # Read the type of Element to store
    tag = TagType(json_data["type"])

    if tag == TagType.CHAINLINK:
        # Create a representation of the Chainlink object to write to the database
        cl = Chainlink()
        # Update the parent object to indicate that it has a new child
        collection = Collection.objects.get(url=parent)
        articleCount = Chainlink.objects.filter(collection=collection).count()
        # chainlink order starts at 0
        cl.order = articleCount
        articleCount += 1
        cl.collection = collection
        cl.text = db_try_title(Chainlink, json_data["text"])
        cl.url = db_try_url(TagType.CHAINLINK)
        cl.public = json_data["is_public"]
        cl.date = timezone.now()

        # write objects to the database
        cl.save()

        # return the request with the url updated with the url assigned to this chainlink
        json_data["url"] = cl.url
        json_data["order"] = cl.order

    elif tag == TagType.HEADER3 or tag == TagType.CODE or tag == TagType.LINEBREAK or tag == TagType.PARAGRAPH:
        # Update the chainlink object that's a parent of the element to be written to the database
        chainlink = Chainlink.objects.get(url=json_data["url"])
        numElements = Content.objects.filter(chainlink=chainlink).count()

        # Create a representation of the Content object to write to database
        content = Content()
        content.chainlink = chainlink
        content.order = json_data["order"]
        if content.order != numElements - 1:  # If the element we are inserting is not at the end but somewhere
            # in the beginning or middle of the Chainlink then shift all Content up in the order.
            for i in range(json_data["order"] + 1, numElements):
                try:
                    Content.objects.get(chainlink=chainlink, order=i).order += 1  # asynchronously update the order
                    # field for all elements after this one
                except Content.DoesNotExist:
                    print("ERROR: A text element specified after the new element wasn't found. Something is wrong.")
                    #chainlink.count -= 1  # We've discovered a missing element so the count must be off
                    # Find the next existing Content after the one to be added.
                    for j in range(i + 1, numElements):
                        try:
                            # Subtract from this first future element an amount equal to distance we had to travel to
                            # get to this element.
                            Content.objects.get(chainlink=chainlink, order=j).order -= (j - i)
                            break
                        except Content.DoesNotExist:
                            continue

        content.tag = tag
        content.text = json_data["text"]
        content.public = json_data["is_public"]

        # Write changes to the database
        chainlink.save()
        content.save()
        json_data["order"] = content.order

    elif tag == TagType.COLLECTION:
        # Create a representation of the Article as a python object
        collection = Collection()
        collection.text = db_try_title(Collection, json_data["text"])
        collection.url = db_try_url(TagType.HEADER1)
        collection.public = json_data["is_public"]
        collection.date = json_data["date"]

        # Write Python Article object to database
        collection.save()

        # If the landing page flag is set then also write the generated url to the LANDING_PAGE_URL field of the .env
        # file
        if is_landing_page:
            logged_in_user = Account.objects.get(user=user)
            logged_in_user.landing_page_url = collection.url
            logged_in_user.save()

        # Set the url field now that we've assigned a url so that frontend can redirect the user to this new collection.
        json_data["url"] = collection.url

    elif tag == TagType.HEADER1:
        collection = Collection.objects.get(url=parent)
        header = Header()
        header.collection = collection
        header.text = db_try_title(Header, json_data["text"])
        header.save()

    return json.dumps(json_data)


def db_remove(table, url, order):
    """
    Delete data from the database.

    :param table: identify table holding the target
    :param url: url string identifying target item
    :param order: This is an int identifier used in tandem with url to identify Content type targets. It is this field
    # that will get updated for all subsequent Content elements so that there is no gap in the element ordering
    """
    if table == Collection:
        target = table.objects.get(url=url)

    elif table == Chainlink:
        target = table.objects.get(url=url)
        parent_article = target.collection
        parent_article_count = Chainlink.objects.filter(collection=parent_article).count()
        for i in range(order + 1, parent_article_count):
            next_pos_els = Chainlink.objects.filter(collection=parent_article, order=i)
            for obj in next_pos_els:
                obj.order -= 1
                obj.save()
        parent_article.save()

    elif table == Content:
        parent_chainlink = Chainlink.objects.get(url=url)
        parent_chainlink_count = Content.objects.filter(chainlink=parent_chainlink).count()
        target = table.objects.get(chainlink=parent_chainlink, order=order)
        for i in range(order + 1, parent_chainlink_count):
            next_pos_els = Content.objects.filter(chainlink=parent_chainlink, order=i)
            for obj in next_pos_els:
                obj.order -= 1
                obj.save()
        parent_chainlink.save()

    target.delete()


def db_update(table, url, order, payload):
    """
    Alter the contents of a database item

    :param table: identify table holding the target
    :param url: url string identifying target item
    :param order: item identifier used in tandem with url to identify Content type targets
    :param payload: string indicating changes to make to target item
    """
    new_title = payload
    if table == Chainlink:
        target = table.objects.get(url=url)  # Get the record that we want to modify.
        if target.text != new_title:  # Check if the new text matches the old one. If they're different then make
            # sure the new text is valid.
            new_title = db_try_title(table, new_title)  # Validate the new text
            target.text = new_title

    elif table == Content:
        parent_chainlink = Chainlink.objects.get(url=url)
        target = table.objects.get(chainlink=parent_chainlink, order=order)
        target.text = new_title

    target.save()


def db_try_title(table, try_title):
    """
    Validate text name input for uniqueness and return unique alternative if needed

    :param table: table within which newly text object resides
    :param try_title: text string to validate for uniqueness
    """
    while table.objects.filter(text=try_title).exists() or try_title == '':
        try_title += "+"
    return try_title


def db_try_url(tag_type, try_url=""):
    """
    Generate a unique url for specified record type

    :param tag_type: type of record this url will be used for
    :param check_url: This string is a url that's checked. If the url is tied to a record then a new url is generated and returned. Otherwise this argument is returned.
    """
    if not try_url:
        try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()
    if TagType.HEADER1:
        while Collection.objects.filter(url=try_url).exists():
            try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()
    elif TagType.CHAINLINK:
        while Chainlink.objects.filter(url=try_url).exists():
            try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()
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


def db_generate_url(tag_type):
    """
    Generate a unique url for specified record type

    :param tag_type: type of record this url will be used for
    """
    try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()
    if TagType.HEADER1:
        while Collection.objects.filter(url=try_url).exists():
            try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()
    elif TagType.CHAINLINK:
        while Chainlink.objects.filter(url=try_url).exists():
            try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()
    return try_url


###################### View Methods ######################

# force collection list page to not get cached so that changes from chainlink pages show up on browser back button
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def generic(request, key=""):
    if not request.user.is_authenticated:
        return login(request)

    if request.method == "GET":
        # Get this collection from the database and return a 404 if it isn"t found
        collection = get_object_or_404(Collection, url=key)

        # Get the header record associated with this collection if one exists.
        if hasattr(collection, "header"):
            header = collection.header
        else:
            header = None

        # Do the same for the footer.
        if hasattr(collection, "footer"):
            footer = collection.footer
        else:
            footer = None

        collections = Collection.objects.all()

        # Chainlink and Content data to be passed into the template takes the following form:
        # (chainlink_object, [child_element_object1, child_element_object2, ...])
        chainlinks = []

        # Populate the above list with tuples of the specified form by first getting the list of all Chainlinks that
        # are attached to this Article.
        for chainlink in Chainlink.objects.filter(collection=collection.pk).order_by("order"):
            contents = []
            for content in Content.objects.filter(chainlink=chainlink.pk).order_by("order"):
                contents.append(content)
            chainlinks.append((chainlink, contents))

        return render(request, "Patchwork/generic.html", {
            "collections": collections,
            "chainlinks": chainlinks,
            "collection": collection,
            "header": header,
            "footer": footer
        })

    elif request.method == "POST":
        # Call auxiliary function to write the Element specified as JSON in the request object
        # The request payload contains JSON specifying the properties of the Element to write to the database
        payload = request.body
        # db_store returns this payload argument back with any modifications that were made (such as a url being
        # updated for example)
        payload = db_store(payload, key)
        # The server response is the payload itself
        return HttpResponse(payload, content_type="application/json")

    elif request.method == "DELETE":
        target_id = request.headers["target"]
        match request.headers["type"]:
            case "collection":
                db_remove(Collection, key, None)
            case "chainlink":
                db_remove(Chainlink, get_url_from_id(target_id), get_order_from_id(target_id))
            case "content":
                db_remove(Content, get_url_from_id(target_id), get_order_from_id(target_id))


    elif request.method == "PUT":
        target_id = request.headers["target"]
        target_update = request.headers["text"]
        match request.headers["type"]:
            case "collection":
                db_update(Collection, key, None, target_update)
            case "chainlink":
                db_update(Chainlink, get_url_from_id(target_id), None, target_update)
            case "content":
                db_update(Content, get_url_from_id(target_id), get_order_from_id(target_id), target_update)

    return render(request, "Patchwork/success.html", {})


@cache_control(no_cache=True, must_revalidate=True,
               no_store=True)  # force chainlink view to get force reloaded so that form view edits appear
def chainlink(request, key):
    if not request.user.is_authenticated:
        return login(request)
    if request.method == 'GET':
        target = get_object_or_404(Chainlink, url=key)
        collections = Collection.objects.all()
        contents = []
        for cont in Content.objects.filter(chainlink=target).order_by('order'):
            contents.append(cont)
        return render(request, 'Patchwork/chainlink.html',
                      {'collections': collections, 'target': target, 'contents': contents, 'url': key})

    elif request.method == 'POST':
        # get POST request json payload
        json_data = json.loads(request.body)

        type = TagType(json_data["type"])
        try_title = json_data["text"]
        url = json_data["url"]
        public = json_data["is_public"]

        if type == TagType.CHAINLINK:
            if db_store(type, key, try_title, public):
                return render(request, 'Patchwork/success.html', {})
        elif type == TagType.HEADER3 or type == TagType.PARAGRAPH or type == TagType.CODE or type == TagType.LINEBREAK:
            if db_store(type, url, try_title, public):
                return render(request, 'Patchwork/success.html', {})

    elif request.method == 'DELETE':
        match TagType(request.headers["type"]):
            case TagType.CHAINLINK:
                db_remove(Chainlink, request.headers["target"], None)
            case TagType.CONTENT:
                db_remove(Content, get_url_from_id(request.headers["target"]),
                          get_order_from_id(request.headers["target"]))

    elif request.method == 'PUT':
        match TagType(request.headers["type"]):
            case TagType.CHAINLINK:
                db_update(Chainlink, request.headers["target"], None, request.headers["text"])
            case TagType.CONTENT:
                db_update(Content, get_url_from_id(request.headers["target"]),
                          get_order_from_id(request.headers["target"]), request.headers["text"])

    return render(request, 'Patchwork/success.html', {})


# def generate(request, is_landing_page, user=None):
def generate(request):
    """
    Create an Article. Write the article to the database and communicate back any updates to the specified article properties by returning the updated properties as JSON.

    :param request: http request object. The payload is the set of poperties for the Article.
    <DEPRECATED> :param is_landing_page: this boolean flag indicates that the created Collection should be set as the landing page for the website
    """
    if not request.user.is_authenticated:
        return login(request)
    if request.method == 'POST':
        # payload = request.body
        # payload = db_store(payload, None, is_landing_page, user)
        # if not is_landing_page:
        #    return HttpResponse(payload, content_type='application/json')
        # else:
        #    return render(request, 'Patchwork/new_landing_page.html', {})
        return aux_generate(request, False, None)
    else:
        return Http404("Only POST is supported for this url")


def index(request):
    """
    Take the user to the configured landing page for the application. If no such page exists then generate a new one
    and display an explanatory welcome page for the user.
    """

    # Determine if a landing page exists and send the user to the landing page if it does
    if not request.user.is_authenticated:
        return login(request)
    if db_check_url(Collection, Account.objects.get(user=request.user).landing_page_url):
        return generic(request, key=Account.objects.get(user=request.user).landing_page_url)
    # Otherwise generate a new landing page for the site and then direct the user to an informational static page
    else:
        post_request_payload = {
            "type": "header",
            "text": "Landing Page",
            "is_public": True,
            "date": str(timezone.now())
        }
        post_request = HttpRequestWrapper(json.dumps(post_request_payload), request.user)
        post_request.method = "POST"
        # return generate(post_request, True, request.user)
        return aux_generate(post_request, True, request.user)


def about(request):
    return render(request, 'Patchwork/about.html', {})


def beat_the_clock(request):
    return render(request, 'Patchwork/beat-the-clock.html', {})


def react(request):
    return render(request, 'Patchwork/react.html', {})


def login(request):
    return render(request, 'Patchwork/login.html', {})


###################### Helper Methods ######################

def aux_generate(request, is_landing_page, user=None):
    """
    Create a new article. If the newly created article should be a landing page send back a static information page. Otherwise send a simple HttpResponse 

    :param request: http request object. The payload is the set of poperties for the Article.
    :param is_landing_page: this boolean flag indicates that the created Collection should be set as the landing page for the website.
    :param user: this is the user object corresponding to the currently logged in user. The landing page will be set for this user.
    """
    payload = request.body
    payload = db_store(payload, None, is_landing_page, user)
    if not is_landing_page:
        return HttpResponse(payload, content_type='application/json')
    else:
        return render(request, 'Patchwork/new_landing_page.html', {})


def get_order_from_id(id):
    """
    Extracts and returns the order value from a chainlink/text id.

    Parameters:
    - id (str): The identifier containing the url stored between the prefix and the order values.

    Returns:
    - int: The extracted order value.

    Raises:
    - TypeError: If the input is not a string.
    - ValueError: If the value specified after the dash is not a valid integer or if the identifier format is invalid.
    """
    if not isinstance(id, str):
        raise TypeError("The argument must be a string")

    last_index = id.rfind("-")

    if last_index != -1:
        order = int(id[last_index + 1:])
        if not isinstance(order, int):
            raise ValueError("The value specified after the dash must be an int")
        return order
    else:
        raise ValueError("An invalid id was specified. Make sure the supplied id contains a dash.")


def get_url_from_id(id):
    """
    Extracts and returns the url from a chainlink/text id.

    Parameters:
    - id (str): The identifier containing the url stored between the prefix and the order values.
    Returns:
    - str: The extracted prefix.

    Raises:
    - TypeError: If the input is not a string.
    - ValueError: If the identifier format is invalid (doesn't contain a dash).
    """
    if not isinstance(id, str):
        raise TypeError("The argument must be a string")

    first_index = id.find("-") + 1
    last_index = id.rfind("-")

    if last_index != -1:
        return id[first_index:last_index]
    else:
        raise ValueError("An invalid id was specified. Make sure the supplied id contains a dash.")


def get_prefix_from_id(id):
    """
    Extracts and returns the prefix from a given identifier.

    Parameters:
    - id (str): The Element id

    Returns:
    - str: The extracted prefix. This is either "chainlink" or "text"

    Raises:
    - TypeError: If the input is not a string.
    - ValueError: If the identifier format is invalid (doesn't contain a dash).
    """
    if not isinstance(id, str):
        raise TypeError("The argument must be a string")

    idx = id.lfind("-")

    if last_index != -1:
        return id[:idx]
    else:
        raise ValueError("An invalid id was specified. Make sure the supplied id contains a prefix section (either"
                         "text or chainlink) followed by a dash followed by the url followed by a dash followed by"
                         "the order.")


def validate_and_return_count(element):
    """
    Validate the Element is defined correctly. If not then fix the issue quietly. Return its child Element count
    regardless.
    :param element: - This is an Element to be validated
    :return: - This function returns an int equal to the number of child elements of `element`.
    """
    if element._meta.object_name == "Chainlink":
        return Content.objects.filter(chainlink=element).count()

    elif element._meta.object_name == "Collection":
        return Chainlink.objects.filter(collection=element).count()
