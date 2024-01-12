from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import User


class TagType(models.TextChoices):  # Define available tag that content can be wrapped in
    HEADER1 = 'header1', _('header1')  # define a fence type
    HEADER2 = 'header2', _('header2')  # define new chainlink, wrap in <section> and create <h2>
    PARAGRAPH = 'paragraph', _('paragraph')  # wrap content in <p>
    CODE = 'code', _('code')  # wrap content in <code>
    HEADER3 = 'header3', _('header3')  # wrap content in <h3>
    LINEBREAK = 'linebreak', _('linebreak')  # insert <br>


class Doc(models.Model):
    key = models.BigAutoField(primary_key=True)  # primary key (useful for testing)
    title = models.CharField(max_length=200)  # The title of the doc
    public = models.BooleanField(default=False)  # Indicate whether this doc will be shareable
    date = models.DateTimeField(default=timezone.now)  # Creation date for this doc
    url = models.CharField(max_length=75)  # relative url for this doc
    count = models.BigIntegerField(default=0)
    def __str__(self):
        return "Article: " + self.title


class Chainlink(models.Model):
    key = models.BigAutoField(primary_key=True)  # primary key
    tag = TagType.HEADER2  # all chainlinks are displayed in <h2>
    doc = models.ForeignKey(Doc, on_delete=models.CASCADE, null=True)  # identifer for which doc this chainlink belongs
    title = models.CharField(max_length=200)  # Header element for this chainlink
    url = models.CharField(max_length=75)  # relative url for the chainlink
    order = models.BigIntegerField(default=0)  # integer value specifying which order on the doc this chainlink appears
    public = models.BooleanField(default=False)  # Indicate whether this chainlink will be shareable
    date = models.DateTimeField(default=timezone.now)  # Creation date for this chainlink. May or may not be visible
    count = models.BigIntegerField(default=0)

    def __str__(self):
        return self.title


class Content(models.Model):
    chainlink = models.ForeignKey(Chainlink, on_delete=models.CASCADE,
                                  null=True)  # identifer for which chainlink this content is for
    tag = models.CharField(  # specify tag to wrap content in
        max_length=10,
        choices=TagType.choices,
        default=TagType.PARAGRAPH,
    )
    order = models.BigIntegerField(default=0)  # indicate the position of this content within the chainlink
    content = models.CharField(max_length=10000)  # specify content to place between tags specified by tag
    # Content can be marked to be visibly redacted from an Article. Redactions are visible to all users and labelled as
    # such (although the content itself cannot be accessed). Redacted content can be made visible by setting the public
    # flag to True.
    public = models.BooleanField(default=True)

    def __str__(self):
        return str(self.order) + " " + self.chainlink.title + " - " + self.tag


class Header(models.Model):
    doc = models.OneToOneField(Doc, on_delete=models.CASCADE, null=False)  # identifier for which doc this chainlink belongs
    tag = TagType.HEADER1
    text = models.CharField(max_length=10000)  # specify content to place between tags specified by tag

    def __str__(self):
        return self.text


class Footer(models.Model):
    doc = models.OneToOneField(Doc, on_delete=models.CASCADE, null=False)  # identifier for which doc this chainlink belongs
    tag = TagType.HEADER1
    text = models.CharField(max_length=10000)  # specify content to place between tags specified by tag

    def __str__(self):
        return self.text


class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    landing_page_url = models.CharField(max_length=128, default="null")

    def __str__(self):
        return str(self.user.username)
