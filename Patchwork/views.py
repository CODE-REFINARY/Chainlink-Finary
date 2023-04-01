from django.http import HttpResponse
from django.shortcuts import render
from .models import Chainlink, Doc, Content

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