#!/bin/bash -ex
DJANGO_SECRET_KEY=$(aws ssm get-parameter --name /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/django_secret_key --output text --query Parameter.Value --region us-east-1)

cd /home/ubuntu/sites/visualizing_russian_tools
echo DJANGO_SETTINGS_MODULE="visualizing_russian_tools.settings.aws" >> .env
echo DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY >> .env
echo DJANGO_ENV=$DEPLOYMENT_GROUP_NAME >> .env
echo DJANGO_LOG_FILE="/home/ubuntu/logs/django-$APPLICATION_NAME-app.log" >> .env
#echo ALLOWED_HOSTS="127.0.0.1 $(curl --silent http://169.254.169.254/latest/meta-data/public-ipv4)" >> .env
echo ALLOWED_HOSTS="*" >> .env