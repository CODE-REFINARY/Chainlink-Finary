from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
import random, string


def generate_random_key(length=14):
    chars = string.ascii_letters + string.digits  # a-zA-Z0-9
    return ''.join(random.choices(chars, k=length))


class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    landing_page_collection = models.ForeignKey("Collection", on_delete=models.SET_NULL, null=True)
    def __str__(self):
        return str(self.user.username)


class TagType(models.TextChoices):
    HEADER1 = "HEADER1"      # The H1 appears as a title to a Collection. It is the name of the Collection and is prominently displayed as the H1 HTML element should be.
    HEADER2 = "HEADER2"
    PARAGRAPH = "PARAGRAPH"
    CODE = "CODE"
    HEADER3 = "HEADER3"
    LINEBREAK = "LINEBREAK"
    IMAGE = "IMAGE"
    LIST = "LIST"
    LINK = "LINK"
    FOOTER_LIST = "FOOTER_LIST"
    NOTE = "NOTE"

"""
def inheritsBody(tag):
    return tag in [TagType.CHAINLINK, TagType.HEADER3, TagType.PARAGRAPH, TagType.CODE, TagType.LINEBREAK, TagType.IMAGE, TagType.LIST, TagType.LINK, TagType.NOTE]


def inheritsFooter(tag):
    return tag in [TagType.FOOTER_LIST, TagType.ENDNOTE]


def inheritsHeader(tag):
    return tag in [TagType.HEADER_BANNER, TagType.HEADER1]
"""

"""def getTableFromTag(tag):
    #Given a TagType, returns its associated table object.
    match tag:
        case TagType.HEADER1:
            return Header1
        case TagType.HEADER2:
            return Header2
        case TagType.PARAGRAPH:
            return Paragraph
        case TagType.CODE:
            return Code
        case TagType.HEADER3:
            return Header3
        case TagType.LINEBREAK:
            return Linebreak
        case TagType.COLLECTION:
            return Collection
        case TagType.IMAGE:
            return Image
        case TagType.LIST:
            return List
        case TagType.LINK:
            return Link
        case TagType.FOOTER_LIST:
            return FooterList
        case TagType.NOTE:
            return Note
        case _:
            raise ValueError(f"Unrecognized tag type: {tag}")
"""


class Theme(models.TextChoices):
    PESHAY = "peshay", _("Peshay Studio Set")
    PATCHWORK = "patchwork", _("Patchwork")
    WASHINGTON = "washington", _("Washington")
    BLUESKY = "bluesky", _("Bluesky")


class HeightSpacing(models.TextChoices):
    SINGLE = "single", _("Single Spacing")
    DOUBLE = "double", _("Double Spacing")
    MAX = "max", _("Maximum Space")


class NoteType(models.TextChoices):
    INFO = "info", _("I (Informational) Blue Icon Message")
    NOTE = "note", _("Yellow Sticky Note Message")
    SUCCESS = "success", _("Green Success Message")
    WARNING = "warning", _("Triangle Icon Yellow Warning Message")
    ERROR = "error", _("Message with Red Error Symbol")


class Collection(models.Model):
    key = models.BigAutoField(primary_key=True)  # primary key (useful for testing)
    public = models.BooleanField(default=False)  # Indicate whether this collection will be shareable
    date = models.DateTimeField(default=timezone.now)  # Creation date for this collection
    url = models.CharField(max_length=75)  # relative url for this collection
    title = models.CharField(max_length=75)
    css = models.CharField(max_length=10000, null=False, blank=True, default="")    # This let's you apply styles to the whole page!
    theme = models.CharField(  # specify tag to wrap text in
        max_length=100,
        choices=Theme.choices,
        default=Theme.PATCHWORK,
    )
    def __str__(self):
        returnme = ""
        returnme += "Url: " + "%.10s" % self.url + " | "
        returnme += "Date: " + str(self.date) + " | "
        returnme += "Public: " + str(self.public) + " | "
        returnme += "Title: " + str(self.title)
        return returnme


class Element(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, null=True)
    order = models.BigIntegerField(default=0)
    public = models.BooleanField(default=True)
    date = models.DateTimeField(default=timezone.now)
    url = models.CharField(max_length=75, primary_key=True, default=generate_random_key())
    archive = models.BooleanField(default=False)
    css = models.CharField(max_length=10000, null=False, blank=True, default="")
    @property
    def content(self):  # This field is how you access the child content element that's associated with this element.
        if hasattr(self, "header2"):
            return self.header2
        elif hasattr(self, "paragraph"):
            return self.paragraph
        elif hasattr(self, "code"):
            return self.code
        elif hasattr(self, "linebreak"):
            return self.linebreak
        elif hasattr(self, "header3"):
            return self.header3
        elif hasattr(self, "link"):
            return self.link
        elif hasattr(self, "list"):
            return self.list
        elif hasattr(self, "note"):
            return self.note
        elif hasattr(self, "image"):
            return self.image
        elif hasattr(self, "header1"):
            return self.header1
        elif hasattr(self, "footerlist"):
            return self.footerlist
        else:
            return None
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + (self.content.tag if self.content else "N/A")
        return returnme


class Header2(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True
    )
    tag = TagType.HEADER2  # all HEADER2s are displayed in <h2>
    text = models.CharField(max_length=200)  # Header text
    external = models.URLField(max_length=200, null=True, blank=True)  # URL for external link
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Date: " + str(self.date) + " | "
        returnme += "Public: " + str(self.public) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Text: " + "%.35s" % str(self.text)
        return returnme


class Paragraph(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    tag = TagType.PARAGRAPH
    text = models.CharField(max_length=1000000, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Date: " + str(self.date) + " | "
        returnme += "Public: " + str(self.public) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Text: " + "%.35s" % str(self.text)
        return returnme


class Code(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    tag = TagType.CODE
    text = models.CharField(max_length=1000000, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Date: " + str(self.date) + " | "
        returnme += "Public: " + str(self.public) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Text: " + "%.35s" % str(self.text)
        return returnme


class Linebreak(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    tag = TagType.LINEBREAK
    # Originally there were 3 choices for the height: a "single", a "double", and a "maximum" spacing option
    height = models.CharField(max_length=100, choices=HeightSpacing.choices, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Date: " + str(self.date) + " | "
        returnme += "Public: " + str(self.public) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Height: " + str(self.height)
        return returnme


class Header3(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    tag = TagType.HEADER3
    text = models.CharField(max_length=10000, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Date: " + str(self.date) + " | "
        returnme += "Public: " + str(self.public) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Text: " + "%.35s" % str(self.text)
        return returnme


class Image(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    tag = TagType.IMAGE

    # This field tells us where images
    img = models.ImageField(upload_to='image_uploads/')
    # This does the same thing as the HTML 'title' attribute of <img>. It's a tooltip for screen readers and instances
    # where the image can't be loaded.
    title = models.CharField(max_length=10000)
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Date: " + str(self.date) + " | "
        returnme += "Public: " + str(self.public) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Text: " + "%.35s" % str(self.text)
        return returnme


class Note(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    tag = TagType.NOTE
    text = models.CharField(max_length=100000, default="")
    # This type field is for specifying how the note section should look. These are inspired (read also `ripped off`
    # from the options available in the Confluence Note feature which this model is inspired by.
    type = models.CharField(max_length=100, choices=NoteType.choices, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Date: " + str(self.date) + " | "
        returnme += "Public: " + str(self.public) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Text: " + "%.35s" % str(self.text) + " | "
        returnme += "Note Type: " + "%.35s" % self.type
        return returnme


class Link(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    tag = TagType.LINK
    context_note = models.CharField(max_length=10000, null=False, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Context Note: " + "%.35s" % str(self.context_note)
        return returnme


class List(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    tag = TagType.LIST
    content = models.JSONField()
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        return returnme


"""
class Header(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, null=False)
    order = models.BigIntegerField(default=0)
    css = models.CharField(max_length=10000, null=False, blank=True, default="")
    @property
    def content(self):  # This field is how you access the child content element that's associated with this element.
        if hasattr(self, "header1"):
            return self.header1
        else:
            return None
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Tag: " + (self.content.tag if self.content else "N/A")
        return returnme
"""


class Header1(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    tag = TagType.HEADER1
    text = models.CharField(max_length=10000)
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Text: " + "%.35s" % str(self.text)
        return returnme

"""
class HeaderBanner(Body):
    header_ptr = models.OneToOneField(
        Header,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    url = models.CharField(max_length=75, primary_key=True, default=generate_random_key())
    tag = TagType.HEADER_BANNER
    content = models.JSONField()
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        return returnme
"""

"""
class Footer(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, null=False)
    order = models.BigIntegerField(default=0)
    css = models.CharField(max_length=10000, null=False, blank=True, default="")
    @property
    def content(self):  # This field is how you access the child content element that's associated with this element.
        if hasattr(self, "endnote"):
            return self.endnote
        else:
            return None
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Tag: " + (self.content.tag if self.content else "N/A")
        return returnme
"""

"""
# This is just a paragraph that appears in the footer section of the Collection. The options available here are
# pretty much identical to what you get when you create a regular paragraph in a Chainlink.
class Endnote(Footer):
    footer_ptr = models.OneToOneField(
        Footer,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    url = models.CharField(max_length=75, primary_key=True, default=generate_random_key())
    tag = TagType.ENDNOTE
    text = models.CharField(max_length=10000)
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        returnme += "Text: " + "%.35s" % self.text
        return returnme
"""


# This is a list of items that appear in the footer section of a Collection. This list is supposed to be very
# customizable with things like the ability to display the contents vertically or horizontally.
class FooterList(Element):
    element_ptr = models.OneToOneField(
        Element,
        on_delete=models.CASCADE,
        parent_link=True,
    )
    tag = TagType.FOOTER_LIST
    content = models.JSONField()
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title) + " | "
        return returnme