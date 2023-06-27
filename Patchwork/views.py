from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from .models import Chainlink, Doc, Content
from django.utils import timezone
import random
import json
import hashlib


def generic(request, key):
    document = get_object_or_404(Doc, url=key)
    print(document)
    if request.method == 'POST':
        # get POST request json payload
        json_data = json.loads(request.body)

        type = json_data["type"]
        try_title = json_data["title"]

        if type == "chainlink":
            chainlink = Chainlink()
            chainlink.doc = document

            while (Chainlink.objects.filter(title=try_title).exists() or try_title == ''):
                try_title += "+"
            chainlink.title = try_title


            chainlink.order = document.count
            document.count = document.count + 1

            try_url = hashlib.sha256(chainlink.title.encode('UTF-8')).hexdigest()
            chainlink.url = try_url

            chainlink.public = json_data["is_public"]
            chainlink.date = timezone.now()
            document.save()
            chainlink.save()

        return render(request, 'Patchwork/success.html', {})

    docs = Doc.objects.all()
    chainlinks = Chainlink.objects.filter(doc=document.pk).order_by('order')
    contents = []
    for link in chainlinks:
        contents.append(link)
        for cont in Content.objects.filter(chainlink=link.pk).order_by('order'):
            contents.append(cont)
    return render(request, 'Patchwork/generic.html', {'docs': docs, 'chainlinks': chainlinks, 'document': document, 'contents': contents})


def chainlink(request, key):
    target = get_object_or_404(Chainlink, url=key)
    docs = Doc.objects.all()
    contents = []
    for cont in Content.objects.filter(chainlink=target).order_by('order'):
        contents.append(cont)
    return render(request, 'Patchwork/chainlink.html', {'docs': docs, 'target': target, 'contents': contents})


def generate(request):
    # generate.html is just a standard form for creating a new doc entry in the database once generic.html is loaded
    # user enters a title for the new doc submit button on generic.html causes a POST which sends date, title,
    # public field info to the server. Server creates a doc with a primary key server hashes primary key (key field)
    # using HashId, appends ".html" onto it and stores value in the url field
    if request.method == 'POST':
        # get POST request json payload
        json_data = json.loads(request.body)

        # Make sure doc title is unique otherwise fail
        try_title = json_data['title']
        if Doc.objects.filter(title=try_title).exists() or try_title == '':
            try_title += "+"

        # Ensure url is unique
        try_url = hashlib.sha256(try_title.encode('UTF-8')).hexdigest()
        # try_url = random.randint(1, 9999999)
        # while Doc.objects.filter(url=try_url).exists():
        #    try_url = random.randint(1, 9999999)

        # Add entry doc to table
        doc = Doc()
        doc.title = try_title
        doc.url = try_url
        doc.public = json_data['is_public']
        doc.date = timezone.now()
        doc.save()

        # Add url as response header
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


def pckb(request):
    docs = Doc.objects.all()
    return render(request, 'Patchwork/pckb.html', {'docs': docs})


def test(request):
    docs = Doc.objects.all()
    document = Doc.objects.get(key=1)
    chainlinks = Chainlink.objects.filter(doc=1)
    contents = Content.objects.all()
    return render(request, 'Patchwork/test.html',
                  {'document': document, 'docs': docs, 'chainlinks': chainlinks, 'contents': contents})
