#!/bin/bash

./manage.py migrate
./manage.py collectstatic --clear --noinput
./manage.py import_clancy_sqldump

# Start gunicorn processes
exec gunicorn -c visualizing_russian_tools/gunicorn.conf.py visualizing_russian_tools.wsgi:application
