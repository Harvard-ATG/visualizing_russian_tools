#!/bin/bash
set -e
cd /app
./manage.py migrate
./manage.py setup_clancy_database
./manage.py runserver 0.0.0.0:8000