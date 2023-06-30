# Legacy Deployment Commands
# web: python manage.py makemigrations --settings=Chainlink.settings.heroku
# web: python manage.py migrate --settings=Chainlink.settings.heroku
# web: python manage.py collectstatic --settings=Chainlink.settings.heroku
# web: python manage.py createsuperuser --noinput --settings=Chainlink.settings.heroku
# web: python manage.py runserver 0.0.0.0:$PORT --settings=Chainlink.settings.heroku

web: python manage.py makemigrations
web: python manage.py migrate
web: python manage.py collectstatic
web: python manage.py createsuperuser --noinput
web: python manage.py runserver 0.0.0.0:$PORT
