# Chainlink Finary

## Setup
<p>Chainlink Finary is a web application that currently lives at https://www.chainlinkfinary.com/. This application is can
be run locally using Docker. Using the included `docker-compose.yml` file you can spin up all the containers and
necessary to run the application. In order for this to work you must have root privileges on your machine and your
port 8000 must be free. With these requirements met you may spin up the containers by running `sudo docker compose up`
in the same directory as the `docker-compose.yml` file.</p>

<p>The server container which is named `django` will not work unless you have defined a .env file in the same directory as
this README.md file. The included `.envTEMPLATE` file contains the .env settings that I use when I run the application
locally. Instead of creating a new .env file I recommend just renaming `.envTEMPLATE` to `.env`.</p>

<p>The BH_HOST variable defined in `.envTEMPLATE` specifies the IP address of the database (but not port). If you are
running this program on a Windows machine you will want to set this value to `host.docker.internal`. If you are on
Linux or MacOS you will want to set this to `172.17.0.1`.</p>
