from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse
from django.core.exceptions import SuspiciousOperation
from django.views import View
from django.urls import reverse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json

from visualizing_russian_tools.exceptions import JsonBadRequest
from . import textparser, htmlgenerator

class TextParserAPIView(View):
    def post(self, request):
        if request.content_type != "application/json":
            raise JsonBadRequest("Expected JSON accept or content type header")
        try:
            text = json.loads(request.body.decode('utf-8'))
        except ValueError:
            raise JsonBadRequest('Invalid JSON')

        # Set upper bound on maximum length of the text
        if len(text) > 100:
            raise ValueError("Submitted text is too large (maximum 10,000 characters).")

        # Parse the submitted text
        parsed_data = self._parse(text)

        # Include rendered HTML in the JSON response if requested
        render_html = request.GET.get('html', 'n') != 'n'
        if render_html:
            parsed_data["html"] = htmlgenerator.tokens2html(tokens=parsed_data["tokens"])

        return JsonResponse(parsed_data, safe=False)

    def _parse(self, text):
        return textparser.parse(text)

text_parser_api_view = csrf_exempt(TextParserAPIView.as_view())
