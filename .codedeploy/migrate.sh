#!/bin/bash -ex
cd /home/ubuntu/sites/visualizing_russian_tools
pipenv run python3 manage.py migrate
pipenv run python3 manage.py import_clancy_sqldump