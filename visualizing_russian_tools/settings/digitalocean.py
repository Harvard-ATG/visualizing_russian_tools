from .local import *

DEBUG = False

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'uGACpvzrJxtkJnxz7HaRYnHnANwHudehmQeDAgcrw8uk2vtBZu8bY4HtMeTqtD8Q')

# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(ROOT_DIR, 'default.sqlite3'),
    },
    'clancy_database': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(ROOT_DIR, 'clancy_database', 'russian.sqlite3'),
    }
}

DATABASE_ROUTERS = ['visualizing_russian_tools.database_routers.RussianRouter']

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
