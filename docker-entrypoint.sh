#!/bin/bash

cd /app
./manage.py migrate               # Apply database migrations 
./manage.py import_clancy_sqldump # Import default data

# Start gunicorn processes
exec gunicorn -c visualizing_russian_tools/gunicorn.conf.py visualizing_russian_tools.wsgi:application
