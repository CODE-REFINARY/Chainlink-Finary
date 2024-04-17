from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

# Conceptually the "tags" defined here are what are referred to as "Elements" elsewhere. Element is a fairly broad
# term but really refers to the components of a Collection. The Collection itself is an Element and so are the
# various building blocks of that Collection including <code> sections, <h1> sections, linebreaks, and so on. These
# are all identified via a model field that connects them to an entry from this class. What's happening here is the
# strings that are passed in to views.py via front-end AJAX requests are matched against this list and this match
# is used to identify and assign a type to the new Element that the AJAX request is seeking to create and instantiate.
# For example, the user dispatches an AJAX request with a "chainlink" in the payload which specifies that the created
# database element should be a TagType.CHAINLINK.
class TagType(models.TextChoices):
    HEADER1 = "header"
    CHAINLINK = "CL"
    PARAGRAPH = "P"
    CODE = "CODE"
    HEADER3 = "H3"
    LINEBREAK = "BR"
    COLLECTION = "collection"
    CONTENT = "text"
    FOOTER = "footer"
    FOOTERNOTE = "fn"


class Collection(models.Model):
    key = models.BigAutoField(primary_key=True)  # primary key (useful for testing)
    public = models.BooleanField(default=False)  # Indicate whether this collection will be shareable
    date = models.DateTimeField(default=timezone.now)  # Creation date for this collection
    url = models.CharField(max_length=75)  # relative url for this collection

    def __str__(self):
        return "Collection Url= " + self.url[:10]


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
