# Static
FROM node:14 as static-stage
WORKDIR /code
COPY ./static ./
WORKDIR /code/static/react
RUN npm install
RUN npm run dev

# PYTHON: Pull Base Image
FROM python:3

# Specify directory for Django
WORKDIR /code

# Set Environment Variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies
COPY requirements.txt /code/
RUN pip install -r requirements.txt