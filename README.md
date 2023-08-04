## [Heroku Version]
This project is the Python/Django implementation of the Chainlink Finary concept. This web application is containerized and runs out-of-the box on localhost:8000 with a simple `sudo docker compose up`.

In order to run the server a .env file must be created in the root folder with the `SECRET_KEY` variable set along with `DB_PASSWORD=postgres`.

On Windows the postgres database is accessed within settings.py via `host.docker.internal` whereas on Linux the correct way to access it is with the static IP: `172.17.0.1` assuming a "standard" network configuration.