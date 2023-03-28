from django.urls import path
from . import views

urlpatterns = [
    path('index.html', views.index),                     # this is the landing page for the entire site even though it's technically part of the Patchwork app
    path('transfer-email.html', views.transfer_email),   # this is the 1-way email sender app
    path('about.html', views.about),                     # this is the about page
    path('beat-the-clock.html', views.beat_the_clock),   # this is the "beat the clock" curiosity
    path('gsdocs.html', views.gsdocs),                   # gsdocs
]