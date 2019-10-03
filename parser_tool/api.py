from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse
from django.core.exceptions import SuspiciousOperation
from django.views import View
from django.urls import reverse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json
import logging

from visualizing_russian_tools.exceptions import JsonBadRequest
from clancy_database import lemmatizer, queries
from . import tokenizer, textparser, htmlgenerator

logger = logging.getLogger(__name__)

MAX_TEXT_LENGTH = 400000


def get_request_body_json(request):
    if request.content_type != "application/json":
        raise JsonBadRequest("Expected JSON accept or content type header")
    if len(request.body.decode('utf-8')) > MAX_TEXT_LENGTH:
        raise ValueError("Submitted request is too large (maximum {max_text_length:,} characters).".format(max_text_length=MAX_TEXT_LENGTH))

    try:
        body = json.loads(request.body.decode('utf-8'))
    except ValueError:
        raise JsonBadRequest('Invalid JSON')
    return body


class LemmaAPIView(View):
    def get(self, request):
        status = "success"
        message_for_status = {
            "fail": "Missing 'word' or 'lemma_id' query parameter",
            "error": "Internal server error"
        }

        data = []
        try:
            if "word" in request.GET:
                word = request.GET.get("word", "").strip()
                data = queries.lookup_lemma_by_word(word)
            elif "lemma_id" in request.GET:
                lemma_id = request.GET.get("lemma_id", "").strip()
                data = queries.lookup_lemma_by_id(lemma_id)
            else:
                status = "fail"
        except Exception as e:
            logger.exception(e)
            status = "error"

        result = {"status": status}
        if status == "success":
            result["data"] = {"lemmas": data}
        if status in message_for_status:
            result["message"] = message_for_status[status]

        logger.debug("lemma response data=%s" % result)

        return JsonResponse(result, safe=False)


class TokenizeAPIView(View):
    def post(self, request):
        body = get_request_body_json(request)
        status = "success"
        message_for_status = {
            "error": "Internal server error"
        }
        tokens = []
        try:
            tokens = tokenizer.tokenize(body)
            tokens = tokenizer.tag(tokens)
        except Exception as e:
            logger.exception(e)
            status = "error"

        result = {"status": status}
        if status == "success":
            result["data"] = {"tokens": tokens}
        if status in message_for_status:
            result["message"] = message_for_status[status]

        logger.debug("tokenized response data=%s" % result)

        return JsonResponse(result, safe=False)


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

    def post(self, request):
        body = get_request_body_json(request)
        status = "success"
        message_for_status = {
            "error": "Internal server error"
        }
        try:
            text = body.get("text", "")
            parsed_data = textparser.parse(text)
        except Exception as e:
            logger.exception(e)
            status = "error"

        result = {"status": status}
        if status == "success":
            result["data"] = {
                "lemmas": parsed_data["lemmas"],
                "forms": parsed_data["forms"],
                "tokens": parsed_data["tokens"],
            }
        if status in message_for_status:
            result["message"] = message_for_status[status]

        logger.debug("lemmatize response data=%s" % result)

        return JsonResponse(result, safe=False)

class TextParserAPIView(View):
    def post(self, request):
        body = get_request_body_json(request)
        text = body.get("text", "")
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
tokenize_api_view = csrf_exempt(TokenizeAPIView.as_view())
lemma_api_view = csrf_exempt(LemmaAPIView.as_view())
