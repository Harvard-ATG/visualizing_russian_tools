#!/bin/bash -ex

# Start gunicorn processes
exec gunicorn -c visualizing_russian_tools/gunicorn.conf.py visualizing_russian_tools.wsgi:application
