from django.urls import path
from . import views

urlpatterns = [
    path("", views.index),
    path("index.html", views.index, name="index"),                                  # landing page
    path("profile.html", views.profile),     # This is the site "home" page
    path("profile.html", views.profile, name="profile"),               # this is the landing page for the entire site even though it"s technically part of the Patchwork app
    path("generate", views.generate, name="generate"), # this is navigated to by the "+" in the navbar: generate a new page with a random url (permalink)
    path("about.html", views.about, name="about"),  # this is the about page
    path("article/<str:key>.html", views.generic, name="article"),  # regularly generated blog pages match here
    path("chainlink/<str:key>.html", views.chainlink, name="chainlink"),
    path("generic.html", views.generic, name="generic"),                    # used for POSTs to generate dynamic content
    path("react.html", views.react),
    path("login.html", views.login, name="login"),
    path("logout", views.logout, name="logout"),
]
