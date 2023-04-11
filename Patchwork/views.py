from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from .models import Chainlink, Doc, Content

def contains(data, target):
    for item in data:
        if item == target:
            return True
    return False

def generic(request, key):
    docs = Doc.objects.all()
    document = get_object_or_404(Doc, pk=key)
    #chainlinks = Chainlink.objects.filter(doc=key).order_by('order')
    contents = []
    for link in Chainlink.objects.filter(doc=key).order_by('order'):
        contents.append(link)
        for cont in Content.objects.filter(chainlink=link).order_by('order'):
            contents.append(cont)
            
    #contents = Content.objects.filter(contains(chainlinks, chainlink)).order_by('chainlink', 'order')
    return render(request, 'patchwork/generic.html', {'docs': docs, 'document': document, 'contents': contents})

def index(request):
    chainlinks = Chainlink.objects.filter()
    context = {         # This logic will determine which chainlinks are displayed
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
    document = Doc.objects.get(key=6)
    chainlinks = Chainlink.objects.filter(doc=6)
    contents = Content.objects.all()
    return render(request, 'Patchwork/test.html', {'document': document, 'docs': docs, 'chainlinks': chainlinks, 'contents': contents})