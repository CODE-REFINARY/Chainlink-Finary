from django.db import models
from django.utils import timezone

from django.utils.translation import gettext_lazy as _

class Doc(models.Model):
    key = models.BigAutoField(primary_key=True)                         # primary key (useful for testing)
    title = models.CharField(max_length=200)                            # The title of the doc
    public = models.BooleanField(default=False)                         # Indicate whether this doc will be shareable
    date = models.DateTimeField(default=timezone.now)                   # Creation date for this doc
    url = models.CharField(max_length=75)                               # relative url for this doc
    
    def __str__(self):
        return self.title
        
class Chainlink(models.Model):
    key = models.BigAutoField(primary_key=True)                         # primary key
    doc = models.ForeignKey(Doc, on_delete=models.CASCADE, null=True)   # identifer for which doc this chainlink belongs
    name = models.CharField(max_length=200)                             # Header element for this chainlink
    order = models.BigIntegerField(default=0)                           # integer value specifying which order on the doc this chainlink appears
    public = models.BooleanField(default=False)                         # Indicate whether this chainlink will be shareable
    date = models.DateTimeField(default=timezone.now)                   # Creation date for this chainlink. May or may not be visible
  
    def __str__(self):
        return self.name

class Content(models.Model):
    class TagType(models.TextChoices):                                  # Define available tag that content can be wrapped in
        PARAGRAPH   = 'p'   , _('paragraph')                            # wrap content in <p>
        CODE        = 'code', _('code')                                 # wrap content in <code>
        HEADER      = 'h3'  , _('header')                               # wrap content in <h3>
        LINEBREAK   = 'br'  , _('linebreak')                            # insert <br>

    chainlink = models.ForeignKey(Chainlink, on_delete=models.CASCADE, null=True)       # identifer for which chainlink this content is for
    tag = models.CharField(                                                             # specify tag to wrap content in
        max_length = 10,
        choices=TagType.choices,
        default=TagType.PARAGRAPH,
    )
    order = models.BigIntegerField(default=0)                           # indicate the position of this content within the chainlink
    content = models.CharField(max_length=3000)                         # specify content to place between tags specified by tag
    
    def __str__(self):
        return self.content