import os
from urllib.parse import urlparse

from .base import *  # noqa: F403

# SECURITY WARNING: keep the secret key used in production secret!
# Fail if the secret key is not set
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

LOG_LEVEL = os.environ.get("LOG_LEVEL", "ERROR")

# Hostnames
# https://cloud.google.com/python/django/run#csrf_configurations
ALLOWED_HOSTS_ENV = os.environ.get("ALLOWED_HOSTS", None)
if ALLOWED_HOSTS_ENV:
    CSRF_TRUSTED_ORIGINS = os.environ.get("ALLOWED_HOSTS").split(",")
    ALLOWED_HOSTS = [urlparse(url).netloc for url in CSRF_TRUSTED_ORIGINS]
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
else:
    ALLOWED_HOSTS = ["*"]

# Database configuration
# For GCP Cloud Run ("sunsetting environment") we are baking the data layer into the container,
# so we use the same SQLite database as the local settings.

# Static files
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"

# Cors headers
# CORS_ORIGIN_WHITELIST = [origin for origin in os.environ.get('CORS_ORIGIN_WHITELIST', '').split(' ') if origin]
CORS_ORIGIN_ALLOW_ALL = True
