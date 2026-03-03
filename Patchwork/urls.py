from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name='collection_index'),   # This is where you end up if you don't specify a collection to view
    path("about.html", views.about, name="about"),  # this is the about page
    path("login", views.login, name="login"),   # This is reached when you click the log in button
    path("logout", views.logout, name="logout"),    # This is reached if you click the log out button
    path("<str:url>", views.generic, name="collection"),    # This is where you go when you specify a collection url after /collections/
]
