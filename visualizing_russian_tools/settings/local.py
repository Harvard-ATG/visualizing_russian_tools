from .base import *

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'VUBevwwnHxXKG3UaGpxac795KpWhsPmCqhZMztCVb6hAZJfRNGhKrFrUd4YPbuYD')

DEBUG = True

ALLOWED_HOSTS = []

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(ROOT_DIR, 'default.sqlite3'),
    },
    #'clancy_database': {
    #    'ENGINE': 'django.db.backends.sqlite3',
    #    'NAME': os.path.join(ROOT_DIR, 'clancy_database', 'russian.sqlite3'),
    #}
}

#DATABASE_ROUTERS = ['visualizing_russian_tools.database_routers.DatabaseRouter']

# Cors headers
CORS_ORIGIN_ALLOW_ALL = True

# Cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}