#!/bin/bash -ex
cd /home/ubuntu/sites/visualizing_russian_tools
pipenv run python3 manage.py collectstatic --noinput --clear