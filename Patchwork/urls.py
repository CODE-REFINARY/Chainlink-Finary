from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),  # landing page
    path("about.html", views.about, name="about"),  # this is the about page

    # This is the destination for all things Collections related. Supported request types are GET, POST, PUT, DELETE.
    # GET obviously just returns the webpage. POST is used to create a new Collection. PUT is used to edit an existing
    # Collection. DELETE is for deleting a Collection.
    #path("<str:url>", views.generic, name="collection"),  # regularly generated blog pages match here
    #path("generic.html", views.generic, name="generic"),

    # This is the destination for when you want to view a specific Chainlink. The supported requests are the same as
    # what you have for generic.
    #path("collections/<str:key>.html", views.chainlink, name="chainlink"),
    path("login", views.login, name="login"),
    path("logout", views.logout, name="logout"),
    path("<str:url>", views.generic, name="collection"),  # This is the main page.
]
