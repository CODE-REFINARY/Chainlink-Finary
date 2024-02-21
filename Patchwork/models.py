from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import User


class TagType(models.TextChoices):  # Define available tag that text can be wrapped in
    HEADER1 = 'header',  # define a fence type
    CHAINLINK = "chainlink"  # define new chainlink, wrap in <section> and create <h2>
    PARAGRAPH = 'paragraph', _('paragraph')  # wrap text in <p>
    CODE = 'code', _('code')  # wrap text in <code>
    HEADER3 = 'header3', _('header3')  # wrap text in <h3>
    LINEBREAK = 'linebreak', _('linebreak')  # insert <br>
    COLLECTION = "collection"
    CONTENT = "text"


class Collection(models.Model):
    key = models.BigAutoField(primary_key=True)  # primary key (useful for testing)
    text = models.CharField(max_length=200)  # The text of the collection
    public = models.BooleanField(default=False)  # Indicate whether this collection will be shareable
    date = models.DateTimeField(default=timezone.now)  # Creation date for this collection
    url = models.CharField(max_length=75)  # relative url for this collection

    def __str__(self):
        return "Article: " + self.text + " Url=" + self.url[:10]


class Chainlink(models.Model):
    key = models.BigAutoField(primary_key=True)  # primary key
    tag = TagType.CHAINLINK  # all chainlinks are displayed in <h2>
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE,
                                   null=True)  # identifer for which collection this chainlink belongs
    text = models.CharField(max_length=200)  # Header element for this chainlink
    url = models.CharField(max_length=75)  # relative url for the chainlink
    order = models.BigIntegerField(
        default=0)  # integer value specifying which order on the collection this chainlink appears
    public = models.BooleanField(default=False)  # Indicate whether this chainlink will be shareable
    date = models.DateTimeField(default=timezone.now)  # Creation date for this chainlink. May or may not be visible

    def __str__(self):
        return self.text


class Content(models.Model):
    chainlink = models.ForeignKey(Chainlink, on_delete=models.CASCADE,
                                  null=True)  # identifer for which chainlink this text is for
    tag = models.CharField(  # specify tag to wrap text in
        max_length=10,
        choices=TagType.choices,
        default=TagType.PARAGRAPH,
    )
    order = models.BigIntegerField(default=0)  # indicate the position of this text within the chainlink
    text = models.CharField(max_length=10000)  # specify text to place between tags specified by tag
    # Content can be marked to be visibly redacted from an Article. Redactions are visible to all users and labelled as
    # such (although the text itself cannot be accessed). Redacted text can be made visible by setting the public
    # flag to True.
    public = models.BooleanField(default=True)

    def __str__(self):
        return str(self.order) + " " + self.chainlink.text + " - " + self.tag


class Header(models.Model):
    collection = models.OneToOneField(Collection, on_delete=models.CASCADE,
                                      null=False)  # identifier for which collection this chainlink belongs
    tag = TagType.HEADER1
    text = models.CharField(max_length=10000)  # specify text to place between tags specified by tag

    def __str__(self):
        return self.text


class Footer(models.Model):
    collection = models.OneToOneField(Collection, on_delete=models.CASCADE,
                                      null=False)  # identifier for which collection this chainlink belongs
    tag = TagType.HEADER1
    text = models.CharField(max_length=10000)  # specify text to place between tags specified by tag

    def __str__(self):
        return self.text


class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    landing_page_url = models.CharField(max_length=128, default="null")

    def __str__(self):
        return str(self.user.username)
