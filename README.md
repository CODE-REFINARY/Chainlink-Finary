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

## About
<p>I was talking with a software engineer friend of mine recently, and he mentioned that he really hates Confluence. He
said the only way it works is if your team agrees on a consistent format. I very much sympathize with this critique - in
fact it is the impetus for me creating Chainlink Finary. The easiest way to describe this web app is as a Confluence
clone with way fewer features. I've been using Confluence for several years now and I thought it would be cool to create
a version of Confluence that only has the features that I use and has none of the ones that I don't. The motivation
is exactly what my friend described - an effort to promote consistency across documents by limiting the number of
individual trivial decisions you make when writing out a document, especially formatting decisions.</p>