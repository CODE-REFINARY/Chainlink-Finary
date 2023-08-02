#Initialize the working directory
RUN mkdir /code

# REACT: Build React app
FROM node:14 as node-stage
WORKDIR /code/react
COPY react/package.json react/package-lock.json ./
RUN npm install
COPY react/ .
RUN npm run build

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

# Copy Source Files
COPY . /code/

RUN mkdir /react

# Copy React build from the previous stage
COPY --from=node-stage /code/react/build /code/static/react