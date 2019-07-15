#!/bin/bash -ex
DJANGO_SECRET_KEY=$(aws ssm get-parameter --name /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/django_secret_key --output text --query Parameter.Value --region us-east-1)
ALLOWED_HOSTS=$(aws ssm get-parameter --name /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/allowed_hosts --output text --query Parameter.Value --region us-east-1)
SENTRY_DSN=$(aws ssm get-parameter --name /$APPLICATION_NAME/sentry_dsn --output text --query Parameter.Value --region us-east-1)
SENTRY_ENVIRONMENT=$DEPLOYMENT_GROUP_NAME

cd /home/ubuntu/sites/visualizing_russian_tools
echo DJANGO_SETTINGS_MODULE="visualizing_russian_tools.settings.aws" >> .env
echo DJANGO_LOG_FILE="/home/ubuntu/logs/django-app.log" >> .env
echo DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY >> .env
echo DJANGO_ENV=$DEPLOYMENT_GROUP_NAME >> .env
echo ALLOWED_HOSTS=$ALLOWED_HOSTS >> .env
echo SENTRY_DSN=$SENTRY_DSN >> .env
echo SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT >> .env
