release: chmod u+x release.sh && ./release.sh
web: python manage.py runserver 0.0.0.0:$PORT
celery-worker: celery -A Chainlink worker --loglevel=info
celery-beat: celery -A Chainlink beat --loglevel=info