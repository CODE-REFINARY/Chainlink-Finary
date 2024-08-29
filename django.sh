#!/bin/bash
python manage.py collectstatic --no-input
python -m pip install -r requirements.txt --quiet
python -m celery -A Chainlink worker -l info &
python -m celery -A Chainlink beat -l info &
# python manage.py makemigrations --noinput
# The command below (parrticularly with the --fake flag) fixes the "django_content_type already exists" error. Make sure
# you drop the django_migrations table before running this.
# python manage.py migrate --fake --noinput
# python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000
