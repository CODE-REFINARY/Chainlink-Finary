#!/bin/bash
pip install -r requirements.txt --quiet
python manage.py collectstatic --no-input