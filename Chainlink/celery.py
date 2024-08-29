# django_celery/celery.py
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Chainlink.settings")
app = Celery("Chainlink")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
app.conf.broker_connection_retry_on_startup = True  # This is for a warning that I got about Celery 6
