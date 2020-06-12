import requests

from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Hostnames
ALLOWED_HOSTS = ['*']

# SSL is terminated at the ELB so look for this header to know that we should be in ssl mode
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Database configuration
if 'DB_NAME' in os.environ:
    DATABASES['default'] =  {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USERNAME'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOSTNAME'],
        'PORT': os.environ.get('DB_PORT', 5432),
    }

# Static files
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"

# Cors headers
#CORS_ORIGIN_WHITELIST = [origin for origin in os.environ.get('CORS_ORIGIN_WHITELIST', '').split(' ') if origin]
CORS_ORIGIN_ALLOW_ALL = True
