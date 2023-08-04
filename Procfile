web: sh -c "cd static/react"
web: sh -c "npm install"
web: sh -c "npm run build"
web: sh -c "cd ../.."
web: python manage.py makemigrations
web: python manage.py migrate
web: python manage.py collectstatic
web: python manage.py createsuperuser
web: python manage.py runserver 0.0.0.0:$PORT
