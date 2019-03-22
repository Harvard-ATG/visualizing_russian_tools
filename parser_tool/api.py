from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse
from django.core.exceptions import SuspiciousOperation
from django.views import View
from django.urls import reverse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json
import logging

from visualizing_russian_tools.exceptions import JsonBadRequest
from clancy_database import lemmatizer
from . import tokenizer, textparser, htmlgenerator

logger = logging.getLogger(__name__)


class LemmatizeAPIView(View):
    def get(self, request):
        status = "success"
        message_for_status = {
            "fail": "Missing 'word' query parameter", 
            "error": "Internal server error"
        }

        word = request.GET.get("word", "").strip()
        try:
            lemmas = []
            if word:
                word = tokenizer.canonical(word)
                lemmas = lemmatizer.lemmatize(word)
            else:
                status = "fail" # no word was submitted
        except Exception as e:
            logger.exception(e)
            status = "error"

        result = {"status": status}
        if status == "success":
            result["data"] = {"lemmas": lemmas}
        if status in message_for_status:
            result["message"] = message_for_status[status]

        logger.debug("lemmatize response data=%s" % result)

        return JsonResponse(result, safe=False)


class TextParserAPIView(View):
    MAX_TEXT_LENGTH = 10000
    def post(self, request):
        # Check request
        if request.content_type != "application/json":
            raise JsonBadRequest("Expected JSON accept or content type header")
        if len(request.body.decode('utf-8')) > self.MAX_TEXT_LENGTH:
            raise ValueError("Submitted request is too large (maximum {max_text_length:,} characters).".format(max_text_length=self.MAX_TEXT_LENGTH))

        # Parse the JSON
        try:
            text = json.loads(request.body.decode('utf-8'))
        except ValueError:
            raise JsonBadRequest('Invalid JSON')

        # Process the text
        parsed_data = self._parse(text)
        render_html = request.GET.get('html', 'n') != 'n'
        if render_html:
            parsed_data["html"] = self._tokens2html(parsed_data["tokens"])

        return JsonResponse(parsed_data, safe=False)

    def _parse(self, text):
        return textparser.parse(text)
    
    def _tokens2html(self, tokens):
        return htmlgenerator.tokens2html(tokens=tokens)

text_parser_api_view = csrf_exempt(TextParserAPIView.as_view())
lemmatize_api_view = csrf_exempt(LemmatizeAPIView.as_view())
