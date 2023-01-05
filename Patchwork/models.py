from django.db import models
from django.utils import timezone

class Chainlink(models.Model):
    title = models.CharField(max_length=200)
    created_date = models.DateTimeField(default=timezone.now)
    text = models.TextField()

    def __str__(self):
        return self.title