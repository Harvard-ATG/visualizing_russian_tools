import os

from .base import *  # noqa: F403

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "VUBevwwnHxXKG3UaGpxac795KpWhsPmCqhZMztCVb6hAZJfRNGhKrFrUd4YPbuYD")

DEBUG = True

ALLOWED_HOSTS = []

# Cors headers
CORS_ORIGIN_ALLOW_ALL = True

# Cache
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.dummy.DummyCache",
    }
}
