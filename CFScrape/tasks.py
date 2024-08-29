from bs4 import BeautifulSoup
from django.core.mail import send_mail
import requests
from django.conf import settings
from celery import shared_task

# The purpose of this task will be to scrape the R2R breakout page http://get.rvdata.us/breakout/?id=RC and
# email gtdubinin@ucsd.edu indicating which cruises have filesets that have been released and are
# pending bagging.
def scrape_breakout_page():
    url = 'https://example.com'
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract relevant data
    data = soup.find('div').text

    return data


@shared_task()
def send_email(subject, message, recipient_list):
    send_mail(
        subject,
        message,
        'gtdubinin@gmail.com',  # From email
        recipient_list,
        fail_silently=False,
    )
