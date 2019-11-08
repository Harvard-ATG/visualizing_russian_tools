from django.http import JsonResponse, HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
import json
import logging

from visualizing_russian_tools.exceptions import JsonBadRequest
from clancy_database import lemmatizer, queries
from .htmlcolorizer import HtmlColorizer
from . import tokenizer, lemmatizer, htmlgenerator

logger = logging.getLogger(__name__)

MAX_TEXT_LENGTH = 500000


def get_request_body_html(request):
    if not request.content_type.startswith("text/html"):
        raise JsonBadRequest("Expected HTML content type header")
    if len(request.body.decode('utf-8')) > MAX_TEXT_LENGTH:
        raise ValueError("Submitted request is too large (maximum {max_text_length:,} characters).".format(max_text_length=MAX_TEXT_LENGTH))
    return request.body.decode('utf-8')


def get_request_body_json(request):
    if request.content_type != "application/json":
        raise JsonBadRequest("Expected JSON content type header")
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
            tokens = tokenizer.tokenize_and_tag(body)
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
            lemmatized_data = lemmatizer.lemmatize_text(text)
        except Exception as e:
            logger.exception(e)
            status = "error"

        result = {"status": status}
        if status == "success":
            result["data"] = {
                "lemmas": lemmatized_data["lemmas"],
                "forms": lemmatized_data["forms"],
                "tokens": lemmatized_data["tokens"],
            }
        if status in message_for_status:
            result["message"] = message_for_status[status]

        logger.debug("lemmatize response data=%s" % result)

        return JsonResponse(result, safe=False)

class TextParserAPIView(View):
    def post(self, request):
        body = get_request_body_json(request)
        text = body.get("text", "")
        lemmatized_data = lemmatizer.lemmatize_text(text)
        render_html = request.GET.get('html', 'n') != 'n'
        if render_html:
            lemmatized_data["html"] = htmlgenerator.tokens2html(tokens=lemmatized_data["tokens"])
        return JsonResponse(lemmatized_data, safe=False)


class HtmlColorizerAPIView(View):
    def post(self, request):
        content_type = request.META.get('CONTENT_TYPE', '')
        color_attribute = self.request.GET.get("attribute", "").strip()
        if content_type.startswith("text/html"):
            input_html = get_request_body_html(request)
            output_html = self._parse(input_html, color_attribute)
            response = HttpResponse(output_html, content_type="text/html")
        else:
            body = get_request_body_json(request)
            input_html = body.get("html", "")
            output_html = self._parse(input_html, color_attribute)
            response = JsonResponse({"html": output_html}, safe=False)
        return response

    def _parse(self, input_html, color_attribute):
        h = HtmlColorizer(input_html, color_attribute)
        doc_tokens = h.get_doc_tokens()
        lemmatized_data = lemmatizer.lemmatize_tokens(doc_tokens)
        output_html = h.colorize(lemmatized_data)
        return output_html

text_parser_api_view = csrf_exempt(TextParserAPIView.as_view())
html_colorizer_api_view = csrf_exempt(HtmlColorizerAPIView.as_view())
lemmatize_api_view = csrf_exempt(LemmatizeAPIView.as_view())
tokenize_api_view = csrf_exempt(TokenizeAPIView.as_view())
lemma_api_view = csrf_exempt(LemmaAPIView.as_view())
