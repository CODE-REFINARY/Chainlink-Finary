from django.urls import path
from . import views

urlpatterns = [
    path("", views.index),
    path("index.html", views.index, name="index"),                                  # landing page
    path("profile.html", views.profile),     # This is the site "home" page
    path("profile.html", views.profile, name="profile"),               # this is the landing page for the entire site even though it"s technically part of the Patchwork app
    path("generate", views.generate, name="generate"), # this is navigated to by the "+" in the navbar: generate a new page with a random url (permalink)
    path("about.html", views.about, name="about"),  # this is the about page

    # This is the destination for all things Collections related. Supported request types are GET, POST, PUT, DELETE.
    # GET obviously just returns the webpage. POST is used to create a new Collection. PUT is used to edit an existing
    # Collection. DELETE is for deleting a Collection.
    path("article/<str:key>.html", views.generic, name="article"),  # regularly generated blog pages match here
    #path("generic.html", views.generic, name="generic"),

    # This is the destination for when you want to view a specific Chainlink. The supported requests are the same as
    # what you have for generic.
    path("chainlink/<str:key>.html", views.chainlink, name="chainlink"),
    path("login.html", views.login, name="login"),
    path("logout", views.logout, name="logout"),
]
