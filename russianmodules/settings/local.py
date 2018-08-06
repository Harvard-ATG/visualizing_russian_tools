from .base import *

DEBUG = True

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'VUBevwwnHxXKG3UaGpxac795KpWhsPmCqhZMztCVb6hAZJfRNGhKrFrUd4YPbuYD')

# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'database', 'default.sqlite3'),
    },
    'russian': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'database', 'russian.sqlite3'),
    }
}

DATABASE_ROUTERS = ['russianmodules.database_routers.RussianRouter']
