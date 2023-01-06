from django.db import models
from django.utils import timezone

class Chainlink(models.Model):
    title = models.CharField(max_length=200) # Header element for this chainlink
    public = models.BooleanField(default=False) # Indicate whether this chainlink will be shareable
    created_date = models.DateTimeField(default=timezone.now) # Creation date for this chainlink. May or may not be visible
    text = models.TextField(max_length=3000, blank=True, default=str) # Text that will appear within <p> tags
    bulleted_list = models.fields.json.JSONField(default=str, blank=True) # JSON formatted data that will appear as a bulleted lists with links and/or plaintext
    media_gallery = models.fields.json.JSONField(default=str, blank=True) # JSON formatted data that will appear as a grid of images 

    def __str__(self):
        return self.title