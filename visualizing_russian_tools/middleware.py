import json
import logging
import traceback
import sys

from django.conf import settings
from django.http import HttpResponseServerError

from .exceptions import JsonBadRequest

logger = logging.getLogger(__name__)

class JsonExceptionMiddleware:
    """
    Include this middleware as the last middleware.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Code to be executed for each request before the view (and later middleware) are called.
        try:
            response = self.get_response(request)
        except JsonBadRequest as exc:
            logger.exception(exc)
            response = self.process_exception(request, exc)
        return response

    def process_exception(self, request, exception):
        data = {'reason': 'An error occurred'}
        if settings.DEBUG:
            data['reason'] = str(exception)
            data['traceback'] = traceback.format_exc()
        return HttpResponseServerError(json.dumps(data, indent=4), content_type='application/json')