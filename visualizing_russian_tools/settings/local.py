from .base import *

DEBUG = True

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'VUBevwwnHxXKG3UaGpxac795KpWhsPmCqhZMztCVb6hAZJfRNGhKrFrUd4YPbuYD')

# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases
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
