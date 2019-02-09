#!/bin/bash
set -e
cd /app
./manage.py setup_clancy_database
./manage.py migrate
exec ./manage.py runserver 0.0.0.0:8000