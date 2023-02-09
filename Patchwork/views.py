from django.http import HttpResponse
from django.shortcuts import render
from .models import Chainlink

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