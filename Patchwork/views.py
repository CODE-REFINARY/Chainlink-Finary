from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from .models import Chainlink, Doc, Content
import json


def generic(request, key):
    docs = Doc.objects.all()
    document = get_object_or_404(Doc, url=key)
    # chainlinks = Chainlink.objects.filter(doc=key).order_by('order')
    contents = []
    for link in Chainlink.objects.filter(doc=key).order_by('order'):
        contents.append(link)
        for cont in Content.objects.filter(chainlink=link).order_by('order'):
            contents.append(cont)

    # contents = Content.objects.filter(contains(chainlinks, chainlink)).order_by('chainlink', 'order')
    return render(request, 'Patchwork/generic.html', {'docs': docs, 'document': document, 'contents': contents})


def generate(request):
    # generate.html is just a standard form for creating a new doc entry in the database once generic.html is loaded
    # user enters a title for the new doc submit button on generic.html causes a POST which sends date, title,
    # public field info to the server. Server creates a doc with a primary key server hashes primary key (key field)
    # using HashId, appends ".html" onto it and stores value in the url field
    if request.method == 'POST':
        doc = Doc()
        json_data = json.loads(request.body)
        doc.title = json_data['title']
        doc.public = json_data['is_public']
        doc.url = json_data['url']
        doc.save()
        return render(request, 'Patchwork/index.html', {})
    docs = Doc.objects.all()
    return render(request, 'Patchwork/generate.html', {'docs': docs})


def index(request):
    chainlinks = Chainlink.objects.filter()
    context = {  # This logic will determine which chainlinks are displayed
        'dfd': 'joe'
    }
    return render(request, 'Patchwork/index.html', context)


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
