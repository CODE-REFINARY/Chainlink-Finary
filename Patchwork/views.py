from django.http import HttpResponse
from django.shortcuts import render

def index(request):
    return render(request, 'Patchwork/index.html', {})

def transfer_email(request):
    return render(request, 'Patchwork/transfer-email.html', {})

def about(request):
    return render(request, 'Patchwork/about.html', {})