"""
Django settings for visualizing_russian_tools project.
"""

import os

# Base dir is the project directory containing settings, urlconf, wsgi, etc
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Root dir is the git repository directory
ROOT_DIR = os.path.dirname(BASE_DIR)

# Application definition
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]
THIRD_PARTY_APPS = [
    "corsheaders",
]
LOCAL_APPS = [
    "clancy_database",
    "parser_tool",
]
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django.middleware.gzip.GZipMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "visualizing_russian_tools.middleware.JsonExceptionMiddleware",
]

ROOT_URLCONF = "visualizing_russian_tools.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "visualizing_russian_tools.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.path.join(ROOT_DIR, "default.sqlite3"),
    },
    "clancy_database": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.path.join(ROOT_DIR, "clancy_database.sqlite3"),
    },
}
DATABASE_ROUTERS = [
    "visualizing_russian_tools.database_routers.DatabaseRouter",
]

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
        "LOCATION": os.environ.get("CACHE_LOCATION", os.path.join(ROOT_DIR, "django_cache")),
        "TIMEOUT": os.environ.get("CACHE_TIMEOUT", 86400 * 30),  # default 30 days
        "OPTIONS": {"MAX_ENTRIES": 1000},
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Static files
STATIC_URL = "/static/"
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")]
STATIC_ROOT = os.path.join(ROOT_DIR, "http_static")

# Max size in bytes that the request body can be (default: 2621440, i.e. 2.5MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 2097152  # 2MB

_DEFAULT_LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
_DJANGO_LOG_LEVEL = os.getenv("DJANGO_LOG_LEVEL", "INFO")
_LOG_ROOT = os.getenv("LOG_ROOT", ROOT_DIR)

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "%(levelname)s %(asctime)s %(name)s %(process)d %(thread)d %(message)s"},
        "simple": {"format": "%(levelname)s %(message)s"},
    },
    "filters": {
        "require_debug_true": {
            "()": "django.utils.log.RequireDebugTrue",
        },
        "require_debug_false": {
            "()": "django.utils.log.RequireDebugFalse",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
        "file": {
            "class": "logging.FileHandler",
            "filename": os.path.join(_LOG_ROOT, "app.log"),
            "formatter": "verbose",
        },
    },
    "loggers": {
        # Root level logger
        "": {
            "handlers": ["console"],
            "level": _DEFAULT_LOG_LEVEL,
        },
        # Capture django-related logging
        "django": {
            "handlers": ["console"],
            "level": _DJANGO_LOG_LEVEL,
            "propagate": False,
        },
        "django.db": {
            "handlers": ["console"],
            "level": _DJANGO_LOG_LEVEL,
            "propagate": False,
        },
        # Capture app-specific logging
        "visualizing_russian_tools": {
            "handlers": ["console"],
            "level": _DEFAULT_LOG_LEVEL,
            "propagate": False,
        },
        "clancy_database": {
            "handlers": ["console"],
            "level": _DEFAULT_LOG_LEVEL,
            "propagate": False,
        },
        "parser_tool": {
            "handlers": ["console"],
            "level": _DEFAULT_LOG_LEVEL,
            "propagate": False,
        },
    },
}
