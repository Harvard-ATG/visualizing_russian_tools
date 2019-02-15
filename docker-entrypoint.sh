#!/bin/bash
set -e
cd /app
./manage.py migrate
./manage.py import_clancy_sqldump
./manage.py runserver 0.0.0.0:8000