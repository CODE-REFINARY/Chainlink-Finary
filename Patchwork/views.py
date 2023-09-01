from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from .models import Chainlink, Doc, Content, TagType
from django.views.decorators.cache import cache_control
from django.utils import timezone
from .models import TagType  # enum type for types content/chainlink type(s)
import random  # use this to generate unique titles for fence and/or chainlink
import json  # use this to parse JSON payloads in HTTP requests
import hashlib  # use this to generate hashes for urls
from django.conf import settings


def db_store(properties, parent=""):
    """
    Write data to the database. Call this function from an HTTP POST for non-idempotent data store.

    :param <DEPRECATED> tag_type: tag that this item will be stored as
    :param <DEPRECATED> parent_url: url string to identify the parent of this item
    :param <DEPRECATED> title: the desired title for the database item
    :param <DEPRECATED> public: flag is true if item to be marked public
    :param request: JSON payload specifying the properties of the Element to write to the database
    :param parent (optional): String indicating the url of the parent object of the Element to store. Content uses the url of its Chainlink and thus this parameter is not needed for elements of type Content. In this case, this parameter is only used if no URL is specified in the JSON payload.
    """
    # Parse the stringified json in the argument so that the payload can be read and written to the database
    json_data = json.loads(properties)
    # Read the type of Element to store
    tag = TagType(json_data["type"])

    if tag == TagType.HEADER2:

        # Update the parent object to indicate that it has a new child
        article = get_object_or_404(Doc, url=parent)
        article.count += 1

        # Create a representation of the Chainlink object to write to the database
        cl = Chainlink()
        cl.doc = article
        cl.title = db_try_title(Chainlink, json_data["title"])
        cl.order = article.count
        cl.url = db_try_url(TagType.HEADER2)
        cl.public = json_data["is_public"]
        cl.date = timezone.now()
        cl.count = 0

        # Create a delimiter Content object as is required for Chainlink objects to indicate the end of the chain
        delimiter = Content()
        delimiter.chainlink = cl
        delimiter.tag = TagType.DELIMITER
        delimiter.url = cl.url
        delimiter.order = 0
        delimiter.content = ''

        # write objects to the database
        article.save()
        cl.save()
        delimiter.save()

        # return the request with the url updated with the url assigned to this chainlink
        json_data["url"] = cl.url
        return json.dumps(json_data)
    elif tag == TagType.HEADER3 or tag == TagType.CODE or tag == TagType.LINEBREAK or tag == TagType.PARAGRAPH:

        # Update the chainlink object that's a parent of the element to be written to the database
        chainlink = get_object_or_404(Chainlink, url=parent)
        chainlink.count += 1

        # Update the position of the delimeter to make space for the new Content
        delimiter = Content.objects.filter(url=parent, tag=TagType.DELIMITER).first()
        delimiter.order += 1

        # Create a representation of the Content object to write to database
        content = Content()
        if (json_data["url"] == ""):
            content.url = parent
        else:
            content.url = json_data["url"]
        content.chainlink = chainlink
        content.order = chainlink.count
        content.tag = tag
        content.content = json_data["content"]
        content.public = json_data["is_public"]

        # Write changes to the database
        chainlink.save()
        delimeter.save()
        content.save()
        return json.dumps(json_data)
    elif tag == TagType.HEADER1:
        # Create a representation of the Article as a python object
        article = Doc()
        article.title = db_try_title(Doc, json_data["title"])
        article.url = db_try_url(TagType.HEADER1)
        article.public = json_data["is_public"]
        article.date = json_data["date"]
       
        # Write Python Article object to database
        article.save()

        json_data["url"] = article.url
        return json.dumps(json_data)
    return False


def db_remove(table, url, order):
    """
    Delete data from the database.

    :param table: identify table holding the target
    :param url: url string identifying target item
    :param order: item identifier used in tandem with url to identify Content type targets
    """
    if order is None:
        target = get_object_or_404(table, url=url)
    else:
        target = get_object_or_404(table, url=url, order=order)
    target.delete()


def db_update(table, url, order, payload):
    """
    Alter the contents of a database item

    :param table: identify table holding the target
    :param url: url string identifying target item
    :param order: item identifier used in tandem with url to identify Content type targets
    :param payload: string indicating changes to make to target item
    """
    target_title = payload
    if order is None:
        target = get_object_or_404(table, url=url)
        if target.title != target_title:
            target_title = db_try_title(table, target_title)
        target.title = target_title
    else:
        target = get_object_or_404(table, url=url, order=order)
        target.content = target_title

    target.save()


def db_try_title(table, try_title):
    """
    Validate title name input for uniqueness and return unique alternative if needed

    :param table: table within which newly title object resides
    :param try_title: title string to validate for uniqueness
    """
    while table.objects.filter(title=try_title).exists() or try_title == '':
        try_title += "+"
    return try_title


def db_try_url(tag_type):
    """
    Generate a unique url for specified record type

    :param tag_type: type of record this url will be used for
    """
    try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()
    if TagType.HEADER1:
        while Doc.objects.filter(url=try_url).exists():
            try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()
    elif TagType.HEADER2:
        while Chainlink.objects.filter(url=try_url).exists():
            try_url = hashlib.sha256(str(random.randint(0, 999999999999)).encode('UTF-8')).hexdigest()
    return try_url

@cache_control(no_cache=True, must_revalidate=True,
               no_store=True)  # force doc list page to not get cached so that changes from chainlink pages show up on browser back button
def generic(request, key=''):
    if request.method == 'GET':
        document = get_object_or_404(Doc, url=key)
        docs = Doc.objects.all()
        chainlinks = Chainlink.objects.filter(doc=document.pk).order_by('order')
        contents = []
        for link in chainlinks:
            contents.append(link)
            for cont in Content.objects.filter(chainlink=link.pk).order_by('order'):
                contents.append(cont)
        return render(request, 'Patchwork/generic.html', {'docs': docs, 'chainlinks': chainlinks, 'document': document, 'contents': contents})

    elif request.method == 'POST':
        # Call auxiliary function to write the Element specified as JSON in the request object
        # The request payload contains JSON specifying the properties of the Element to write to the database
        payload = request.body
        # db_store returns this payload argument back with any modifications that were made (such as a url being updated for example)
        payload = db_store(payload, key)
        # The server response is the payload itself
        return HttpResponse(payload, content_type='application/json')

    elif request.method == 'DELETE':
        match request.headers["type"]:
            case "doc":
                db_remove(Doc, key, None)
            case "chainlink":
                db_remove(Chainlink, request.headers["target"], None)
            case "content":
                db_remove(Content, request.headers["target"].split('-')[0], request.headers["target"].split('-')[1])

    elif request.method == 'PUT':
        match request.headers["type"]:
            case "doc":
                db_update(Doc, key, None, request.headers["title"])
            case "chainlink":
                db_update(Chainlink, request.headers["target"], None, request.headers["title"])
            case "content":
                db_update(Content, request.headers["target"].split('-')[0], request.headers["target"].split('-')[1], request.headers["title"])

    return render(request, 'Patchwork/success.html', {})


@cache_control(no_cache=True, must_revalidate=True,
               no_store=True)  # force chainlink view to get force reloaded so that form view edits appear
def chainlink(request, key):
    if request.method == 'GET':
        target = get_object_or_404(Chainlink, url=key)
        docs = Doc.objects.all()
        contents = []
        for cont in Content.objects.filter(chainlink=target).order_by('order'):
            contents.append(cont)
        return render(request, 'Patchwork/chainlink.html',
                      {'docs': docs, 'target': target, 'contents': contents, 'url': key})

    elif request.method == 'POST':
        # get POST request json payload
        json_data = json.loads(request.body)

        type = json_data["type"]
        try_title = json_data["title"]
        url = json_data["url"]
        public = json_data["is_public"]

        if type == "header2":
            if db_store(type, key, try_title, public):
                return render(request, 'Patchwork/success.html', {})
        elif type == 'header3' or type == 'paragraph' or type == 'code' or type == 'linebreak':
            if db_store(type, url, try_title, public):
                return render(request, 'Patchwork/success.html', {})

    elif request.method == 'DELETE':
        match request.headers["type"]:
            case "chainlink":
                db_remove(Chainlink, request.headers["target"], None)
            case "content":
                db_remove(Content, request.headers["target"].split('-')[0], request.headers["target"].split('-')[1])

    elif request.method == 'PUT':
        match request.headers["type"]:
            case "chainlink":
                db_update(Chainlink, request.headers["target"], None, request.headers["title"])
            case "content":
                db_update(Content, request.headers["target"].split('-')[0], request.headers["target"].split('-')[1], request.headers["title"])

    return render(request, 'Patchwork/success.html', {})



def generate(request):
    # generate.html is just a standard form for creating a new doc entry in the database once generic.html is loaded
    # user enters a title for the new doc submit button on generic.html causes a POST which sends date, title,
    # public field info to the server. Server creates a doc with a primary key server hashes primary key (key field)
    # using HashId, appends ".html" onto it and stores value in the url field
    if request.method == 'POST':
        # get POST request json payload
        json_data = json.loads(request.body)
        title = json_data['title']
        public = json_data['is_public']
        url = db_store(TagType.HEADER1, None, title, public)
        if url:
            response = render(request, 'Patchwork/success.html', {})
            response['url'] = url
            return response
        else:
            return render(request, 'Patchwork/failure.html', {})

        response = render(request, 'Patchwork/success.html', {})
        response['url'] = doc.url
        return response
    docs = Doc.objects.all()
    return render(request, 'Patchwork/generate.html', {'docs': docs})


def index(request):
    return generic(request, key=settings.LANDING_PAGE_URL)


def transfer_email(request):
    return render(request, 'Patchwork/transfer-email.html', {})


def about(request):
    return render(request, 'Patchwork/about.html', {})


def beat_the_clock(request):
    return render(request, 'Patchwork/beat-the-clock.html', {})


def gsdocs(request):
    docs = Doc.objects.all()
    return render(request, 'Patchwork/gsdocs.html', {'docs': docs})

def react(request):
    return render(request, 'Patchwork/react.html', {})
