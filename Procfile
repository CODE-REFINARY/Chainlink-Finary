web: python manage.py makemigrations --settings=Chainlink.settings.heroku
web: python manage.py migrate --settings=Chainlink.settings.heroku
web: python manage.py collectstatic --settings=Chainlink.settings.heroku 
web: python manage.py createsuperuser --email=gtdubinin@gmail.com --noinput
web: python manage.py runserver 0.0.0.0:$PORT --settings=Chainlink.settings.heroku
