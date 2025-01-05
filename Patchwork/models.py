from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _


class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    landing_page_collection = models.ForeignKey("Collection", on_delete=models.SET_NULL, null=True)
    def __str__(self):
        return str(self.user.username)


# Conceptually the "tags" defined here are what are referred to as "Elements" elsewhere. Element is a fairly broad
# term but really refers to the components of a Collection. The Collection itself is an Element and so are the
# various building blocks of that Collection including <code> sections, <h1> sections, linebreaks, and so on. These
# are all identified via a model field that connects them to an entry from this class. What's happening here is the
# strings that are passed in to views.py via front-end AJAX requests are matched against this list and this match
# is used to identify and assign a type to the new Element that the AJAX request is seeking to create and instantiate.
# For example, the user dispatches an AJAX request with a "chainlink" in the payload which specifies that the created
# database element should be a TagType.CHAINLINK.
class TagType(models.TextChoices):
    HEADER1 = "H1"      # The H1 appears as a title to a Collection. It is the name of the Collection and is prominently displayed as the H1 HTML element should be.
    CHAINLINK = "CL"    # The Chainlink is similar to an HTML <h2>.
    PARAGRAPH = "P"
    CODE = "CODE"
    HEADER3 = "H3"
    LINEBREAK = "BR", _("linebreak")
    FOOTER = "footer"
    ENDNOTE = "EN"  # Endnotes are paragraphs that appear in the footer
    IMAGE = "IMG", _("image")
    LIST = "LI", _("list")
    LINK = "LINK", _("link")
    HEADER_BANNER = "HBNR", _("header banner")
    FOOTER_LIST = "FTRLI", _("footer list")
    NOTE = "NOTE", _("note")
    COLLECTION = "COL", _("collection")


def inheritsBody(tag):
    return tag in [TagType.HEADER3, TagType.PARAGRAPH, TagType.CODE, TagType.LINEBREAK, TagType.IMAGE, TagType.LIST, TagType.LINK, TagType.NOTE]


def inheritsFooter(tag):
    return tag in [TagType.FOOTER_LIST, TagType.ENDNOTE]


def inheritsHeader(tag):
    return tag in [TagType.HEADER_BANNER, TagType.HEADER1]


def getTableFromTag(tag):
    """
    Given a TagType, returns its associated table object.
    """
    match tag:
        case TagType.HEADER1:
            return Header1
        case TagType.CHAINLINK:
            return Chainlink
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
        case TagType.FOOTER:
            return Footer
        case TagType.ENDNOTE:
            return Endnote
        case TagType.IMAGE:
            return Image
        case TagType.LIST:
            return List
        case TagType.LINK:
            return Link
        case TagType.HEADER_BANNER:
            return HeaderBanner
        case TagType.FOOTER_LIST:
            return FooterList
        case TagType.NOTE:
            return Note
        case _:
            raise ValueError(f"Unrecognized tag type: {tag}")


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
    title = models.ForeignKey("Header1", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")     # This
    # is a link to the Header object that's acting as the title for this Collection. There can only be one Header object
    # that is a title but there can be multiple Header objects associated with this Collection.
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
        returnme += "Title: " + str(self.title.text if self.title else "N/A")
        return returnme


class Chainlink(models.Model):
    key = models.BigAutoField(primary_key=True)  # primary key
    tag = TagType.CHAINLINK  # all chainlinks are displayed in <h2>

    # Chainlinks are always associated with a Collection at creation. This link is defined in this field. If the
    # associated Collection is deleted then a Chainlink is typically deleted. However, if the Chainlink archive field
    # is set to True then the Chainlink should not be deleted. In this case the Chainlink will be orphaned and will
    # not be associated with a Collection. We want to avoid instances where this nullifying behavior occurs,
    # so we'll implement checks and user prompts to warn users against accidentally orphaning Chainlinks that other
    # Collections are referencing.
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, null=True)
    text = models.CharField(max_length=200)  # Header element for this chainlink
    url = models.CharField(max_length=75)  # relative url for the chainlink
    # The user may decide to archive a chainlink which sets this boolean. By default, a created Chainlink is not
    # archived. If a chainlink is archived then it cannot be deleted except with access to the database. An archived
    # chainlink will not be deleted if its Collection is deleted. This means that other Collections that reference
    # this chainlink via Link elements will not be affected by the Chainlink's Collection being deleted.
    archive = models.BooleanField(default=False)
    order = models.BigIntegerField(
        default=0)  # integer value specifying which order on the collection this chainlink appears
    public = models.BooleanField(default=False)  # Indicate whether this chainlink will be shareable
    date = models.DateTimeField(default=timezone.now)  # Creation date for this chainlink. May or may not be visible
    css = models.CharField(max_length=10000, null=False, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Date: " + str(self.date) + " | "
        returnme += "Public: " + str(self.public) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        returnme += "Text: " + "%.35s" % self.text
        return returnme


class Body(models.Model):

    # We do not want body elements to be orphaned. Every body element must be associated with a Chainlink, otherwise
    # we have no way of displaying it.
    chainlink = models.ForeignKey(Chainlink, on_delete=models.CASCADE, null=True)
    order = models.BigIntegerField(default=0)  # indicate the position of this text within the chainlink
    public = models.BooleanField(default=True)
    css = models.CharField(max_length=10000, null=False, default="")
    @property
    def content(self):  # This field is how you access the child content element that's associated with this element.
        if hasattr(self, "paragraph"):
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
        else:
            return None
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Chainlink: " + str(self.chainlink.text) + " | "
        returnme += "Tag: " + (self.content.tag if self.content else "N/A")
        return returnme


class Paragraph(Body):
    tag = TagType.PARAGRAPH
    text = models.CharField(max_length=1000000, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Chainlink: " + str(self.chainlink.text) + " | "
        returnme += "Text: " + "%.35s" % self.text
        return returnme


class Code(Body):
    tag = TagType.CODE
    text = models.CharField(max_length=1000000, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Chainlink: " + str(self.chainlink.text) + " | "
        returnme += "Text: " + "%.35s" % self.text
        return returnme


class Linebreak(Body):
    tag = TagType.LINEBREAK
    # Originally there were 3 choices for the height: a "single", a "double", and a "maximum" spacing option
    height = models.CharField(max_length=100, choices=HeightSpacing.choices, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Chainlink: " + str(self.chainlink.text) + " | "
        return returnme


class Header3(Body):
    tag = TagType.HEADER3
    text = models.CharField(max_length=10000, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Chainlink: " + str(self.chainlink.text) + " | "
        returnme += "Text: " + "%.35s" % self.text
        return returnme


class Image(Body):
    tag = TagType.IMAGE

    # This field tells us where images
    img = models.ImageField(upload_to='image_uploads/')
    # This does the same thing as the HTML 'title' attribute of <img>. It's a tooltip for screen readers and instances
    # where the image can't be loaded.
    title = models.CharField(max_length=10000)
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        returnme += "Image Title: " + "%.35s" % self.title
        return returnme


class Note(Body):
    tag = TagType.NOTE
    text = models.CharField(max_length=100000, default="")
    # This type field is for specifying how the note section should look. These are inspired (read also `ripped off`
    # from the options available in the Confluence Note feature which this model is inspired by.
    height = models.CharField(max_length=100, choices=NoteType.choices, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        returnme += "Text: " + "%.35s" % self.text
        returnme += "Note Type: " + "%.35s" % self.type
        return returnme


class Link(Body):
    tag = TagType.LINK
    # If the Chainlink that's linked here is deleted we don't want this record to be gone either. Instead, we want to
    # alert the user and let them decide whether to keep this Element or not.
    linked_chainlink = models.ForeignKey(Chainlink, on_delete=models.SET_NULL, null=True)

    # I've encountered situations were I want to add a clarifying note to a Chainlink because its use in another
    # workflow requires some clarification or small adjustment. This variable is for that clarifying text.
    context_note = models.CharField(max_length=10000, null=False, default="")
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        returnme += "Linked Chainlink: " + "%.35s" % self.linked_chainlink.title if linked_chainlink else "N/A"
        returnme += "Context Note: " + "%.35s" % self.context_note
        return returnme


class List(Body):
    tag = TagType.LIST
    content = models.JSONField()
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        return returnme


class Header(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, null=False)
    order = models.BigIntegerField(default=0)
    css = models.CharField(max_length=10000, null=False, default="")
    @property
    def content(self):  # This field is how you access the child content element that's associated with this element.
        if hasattr(self, "header1"):
            return self.header1
        else:
            return None
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        returnme += "Tag: " + (self.content.tag if self.content else "N/A")
        return returnme


class Header1(Header):
    tag = TagType.HEADER1
    text = models.CharField(max_length=10000)
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        returnme += "Text: " + "%.35s" % self.text
        return returnme


class HeaderBanner(Header):
    tag = TagType.HEADER_BANNER
    content = models.JSONField()
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        return returnme


class Footer(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, null=False)
    order = models.BigIntegerField(default=0)
    css = models.CharField(max_length=10000, null=True, default="")
    @property
    def content(self):  # This field is how you access the child content element that's associated with this element.
        if hasattr(self, "endnote"):
            return self.endnote
        else:
            return None
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        returnme += "Tag: " + (self.content.tag if self.content else "N/A")
        return returnme


# This is just a paragraph that appears in the footer section of the Collection. The options available here are
# pretty much identical to what you get when you create a regular paragraph in a Chainlink.
class Endnote(Footer):
    tag = TagType.ENDNOTE
    text = models.CharField(max_length=10000)
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        returnme += "Text: " + "%.35s" % self.text
        return returnme


# This is a list of items that appear in the footer section of a Collection. This list is supposed to be very
# customizable with things like the ability to display the contents vertically or horizontally.
class FooterList(Footer):
    tag = TagType.FOOTER_LIST
    content = models.JSONField()
    def __str__(self):
        returnme = ""
        returnme += "Order: " + str(self.order) + " | "
        returnme += "Tag: " + str(self.tag) + " | "
        returnme += "Collection: " + str(self.collection.title.text if self.collection.title else "N/A") + " | "
        return returnme