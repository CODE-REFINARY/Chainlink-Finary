from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from .models import Chainlink, Doc, Content, TagType
from django.views.decorators.cache import cache_control
from django.utils import timezone
from .models import TagType  # enum type for types content/chainlink type(s)
import random  # use this to generate unique titles for fence and/or chainlink
import json  # use this to parse JSON payloads in HTTP requests
import hashlib  # use this to generate hashes for urls


def db_store(tag_type, parent_url, title, public):
    """
    Write data to the database. Call this function from an HTTP POST for non-idempotent data store.

    :param tag_type: tag that this item will be stored as
    :param parent_url: url string to identify the parent of this item
    :param title: the desired title for the database item
    :param public: flag is true if item to be marked public
    """
    tag = TagType(tag_type)
    if tag == TagType.HEADER2:
        parent_fence = get_object_or_404(Doc, url=parent_url)
        cl = Chainlink()
        cl.doc = parent_fence
        cl.title = db_try_title(Chainlink, title)
        cl.order = parent_fence.count
        parent_fence.count += 1
        cl.url = db_try_url(TagType.HEADER2)
        cl.public = public
        cl.date = timezone.now()
        cl.count = 0
        delimiter = Content()
        delimiter.chainlink = cl
        delimiter.tag = TagType.DELIMITER
        delimiter.url = cl.url
        delimiter.order = 0
        delimiter.content = ''
        parent_fence.save()
        cl.save()
        delimiter.save()
    elif tag == TagType.HEADER3 or tag == TagType.CODE or tag == TagType.LINEBREAK or tag == TagType.PARAGRAPH:
        parent_chainlink = get_object_or_404(Chainlink, url=parent_url)
        delimiter = Content.objects.filter(url=parent_url, tag=TagType.DELIMITER).first()
        delimiter.order += 1
        delimiter.save()
        content = Content()
        content.url = parent_url
        content.chainlink = parent_chainlink
        content.order = parent_chainlink.count
        parent_chainlink.count += 1
        parent_chainlink.save()
        content.tag = tag
        content.content = title
        content.save()
    elif tag == TagType.HEADER1:
        fence = Doc()
        fence.title = db_try_title(Doc, title)
        fence.url = db_try_url(TagType.HEADER1)
        fence.public = public
        fence.date = timezone.now()
        fence.save()
        return fence.url
    return True


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
        return render(request, 'Patchwork/generic.html',
                      {'docs': docs, 'chainlinks': chainlinks, 'document': document, 'contents': contents})

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
    docs = Doc.objects.all()
    return render(request, 'Patchwork/index.html', {'docs': docs})


def transfer_email(request):
    return render(request, 'Patchwork/transfer-email.html', {})


def about(request):
    return render(request, 'Patchwork/about.html', {})


def beat_the_clock(request):
    return render(request, 'Patchwork/beat-the-clock.html', {})


def gsdocs(request):
    docs = Doc.objects.all()
    return render(request, 'Patchwork/gsdocs.html', {'docs': docs})
