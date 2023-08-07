#!/bin/bash

npm run dev
python manage.py makemigrations --noinput
python manage.py migrate --noinput
