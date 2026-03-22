#!/bin/bash

# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --no-input

# Start gunicorn
gunicorn medify_backend.wsgi:application --bind 0.0.0.0:$PORT
