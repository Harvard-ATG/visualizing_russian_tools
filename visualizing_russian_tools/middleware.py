import json
import logging
import traceback

import sentry_sdk.capture_exception

from django.conf import settings
from django.http import HttpResponseServerError


logger = logging.getLogger(__name__)


class JsonExceptionMiddleware:
    """
    Include this middleware as the last middleware.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Code to be executed for each request before the view (and later middleware) are called.
        logger.debug("%s before get_response" % self.__class__.__name__)
        response = self.get_response(request)
        logger.debug("%s after get_response (status %s)" % (self.__class__.__name__, response.status_code))
        return response

    def process_exception(self, request, exception):
        logger.error("%s process_exception called: %s" % (self.__class__.__name__, exception))
        response = None
        if self.is_api_call(request):
            data = dict(reason=str(exception))
            if settings.DEBUG:
                data['traceback'] = traceback.format_exc()
            sentry_sdk.capture_exception(exception)
            response = HttpResponseServerError(json.dumps({"error": data}, indent=4), content_type='application/json')
        return response
 
    def is_api_call(self, request):
        return request.META.get("CONTENT_TYPE") == "application/json"
