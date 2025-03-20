"""WSGI config."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "visualizing_russian_tools.settings.local")

application = get_wsgi_application()
