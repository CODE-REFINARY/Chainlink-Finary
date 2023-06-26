from django.urls import path
from . import views

urlpatterns = [
    path('generate.html', views.generate, name='generate'), # this is navigated to by the "+" in the navbar: generate a new page with a random url (permalink)
    path('index.html', views.index),                        # this is the landing page for the entire site even though it's technically part of the Patchwork app
    path('transfer-email.html', views.transfer_email),      # this is the 1-way email sender app
    path('about.html', views.about),                        # this is the about page
    path('beat-the-clock.html', views.beat_the_clock),      # this is the "beat the clock" curiosity
    path('gsdocs.html', views.gsdocs),                      # gsdocs
    path('test.html', views.test),                          # testing page
    path('pckb.html', views.pckb),                          # parent cases knowledge base
    path('<str:key>.html', views.generic, name='generic'),  # regularly generated blog pages match here
]
