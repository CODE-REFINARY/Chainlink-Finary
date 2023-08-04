webpack: sh -c "cd static/react && npm run build"
web: python manage.py makemigrations
web: python manage.py migrate
web: python manage.py collectstatic
web: python manage.py createsuperuser
web: python manage.py runserver 0.0.0.0:$PORT
