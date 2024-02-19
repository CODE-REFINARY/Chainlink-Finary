from django.urls import path
from . import views

urlpatterns = [
    path("", views.index),                                  # landing page
    path("article/index.html", views.index),               # this is the landing page for the entire site even though it"s technically part of the Patchwork app
    path("article/generate.html", views.generate, name="generate"), # this is navigated to by the "+" in the navbar: generate a new page with a random url (permalink)
    path("about.html", views.about),                        # this is the about page
    path("article/<str:key>.html", views.generic, name="article"),  # regularly generated blog pages match here
    path("chainlink/<str:key>.html", views.chainlink, name="chainlink"),
    path("generic.html", views.generic),                    # used for POSTs to generate dynamic content
    path("react.html", views.react),
    path("login.html", views.login),
]
