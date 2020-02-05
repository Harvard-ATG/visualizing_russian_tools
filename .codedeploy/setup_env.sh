#!/bin/bash -ex
AWS_PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
AWS_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
DJANGO_SECRET_KEY=$(aws ssm get-parameter --name /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/django_secret_key --output text --query Parameter.Value --region us-east-1)

cd /home/ubuntu/sites/visualizing_russian_tools
echo DJANGO_SETTINGS_MODULE="visualizing_russian_tools.settings.aws" >> .env
echo DJANGO_LOG_FILE="/home/ubuntu/logs/django-$APPLICATION_NAME.log" >> .env
echo CACHE_LOCATION="/home/ubuntu/cache/django-$APPLICATION_NAME-cache" >> .env
echo DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY >> .env
echo DJANGO_ENV=$DEPLOYMENT_GROUP_NAME >> .env
echo ALLOWED_HOSTS="localhost 127.0.0.1 $AWS_PRIVATE_IP $AWS_PUBLIC_IP .compute-1.amazonaws.com .elb.amazonaws.com visualizingrussian.fas.harvard.edu" >> .env
