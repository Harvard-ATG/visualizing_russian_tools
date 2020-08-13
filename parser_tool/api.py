from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt


import json
import logging

from visualizing_russian_tools.exceptions import JsonBadRequest
from . import apicache
from . import tokenizer
from . import lemmatizer
from . import htmlcolorizer
from . import htmlgenerator


logger = logging.getLogger(__name__)


class BaseAPIView(View):
    MAX_BODY_SIZE = 500000

    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super(BaseAPIView, self).dispatch(request, *args, **kwargs)

    def get_request_body_html(self, request):
        if not request.content_type.startswith("text/html"):
            raise JsonBadRequest("Expected HTML content type header")
        if len(request.body.decode('utf-8')) > self.MAX_BODY_SIZE:
            raise ValueError("Submitted request is too large (maximum {max_size:,} characters).".format(max_size=self.MAX_BODY_SIZE))
        return request.body.decode('utf-8')

    def get_request_body_json(self, request):
        if request.content_type != "application/json":
            raise JsonBadRequest("Expected JSON content type header")
        if len(request.body.decode('utf-8')) > self.MAX_BODY_SIZE:
            raise ValueError("Submitted request is too large (maximum {max_size:,} characters).".format(max_size=self.MAX_BODY_SIZE))
        try:
            body = json.loads(request.body.decode('utf-8'))
        except ValueError:
            raise JsonBadRequest('Invalid JSON')
        return body


class LemmaAPIView(BaseAPIView):
    def get(self, request):
        status = "success"
        message_for_status = {
            "fail": "Missing 'word' or 'id' query parameter",
            "error": "Internal server error"
        }

        data = []
        try:
            if "word" in request.GET:
                word = request.GET.get("word", "").strip()
                data = lemmatizer.lookup_lemma_by_word(word)
            elif "id" in request.GET:
                lemma_id = request.GET.get("id", "").strip()
                if lemma_id.isdigit():
                    data = lemmatizer.lookup_lemma_by_id(lemma_id)
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


class TokenizeAPIView(BaseAPIView):
    def post(self, request):
        body = self.get_request_body_json(request)
        status = "success"
        message_for_status = {
            "error": "Internal server error"
        }
        tokens = []
        try:
            text = body.get("text", "")
            tokens = self.tokenize_and_tag(text)
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
    
    def tokenize_and_tag(self, text):
        return apicache.tokenize_and_tag(text)


class LemmatizeAPIView(BaseAPIView):
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
                lemmas = lemmatizer.lemmatize_word(word)
            else:
                status = "fail"  # no word was submitted
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
        body = self.get_request_body_json(request)
        status = "success"
        message_for_status = {
            "error": "Internal server error"
        }
        try:
            text = body.get("text", "")
            lemmatized_data = self.lemmatize_text(text)
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
    
    def lemmatize_text(self, text):
        return apicache.lemmatize_text(text)


class TextParserAPIView(BaseAPIView):
    def post(self, request):
        body = self.get_request_body_json(request)
        text = body.get("text", "")
        lemmatized_data = self.lemmatize_text(text)
        render_html = request.GET.get('html', 'n') != 'n'
        if render_html:
            lemmatized_data["html"] = htmlgenerator.tokens2html(tokens=lemmatized_data["tokens"])
        return JsonResponse(lemmatized_data, safe=False)

    def lemmatize_text(self, text):
        return apicache.lemmatize_text(text)


class DocumentColorizerAPIView(BaseAPIView):
    def post(self, request):
        content_type = request.META.get('CONTENT_TYPE', '')
        color_attribute = self.request.GET.get("attribute", htmlcolorizer.DEFAULT_COLOR_ATTR).strip()
        if content_type.startswith("text/html"):
            input_html = self.get_request_body_html(request)
            output_html = self.colorize_html(input_html, color_attribute)
            response = HttpResponse(output_html, content_type="text/html")
        else:
            body = self.get_request_body_json(request)
            input_html = body.get("html", "")
            output_html = self.colorize_html(input_html, color_attribute)
            response = JsonResponse({"html": output_html}, safe=False)
        return response

    def colorize_html(self, input_html, color_attribute=None):
        return apicache.colorize_html(input_html, color_attribute)


class ElementsColorizerAPIView(BaseAPIView):
    def post(self, request):
        color_attribute = self.request.GET.get("attribute", htmlcolorizer.DEFAULT_COLOR_ATTR).strip()

        body = self.get_request_body_json(request)
        (valid, errors) = self.validate_body(body)
        if not valid:
            result = {
                "status": "invalid",
                "error": errors
            }
            return JsonResponse(result, status=400)

        output = self.colorize_elements(body["elements"], color_attribute)
        result = {
            "status": "success",
            "data": {
                "elements": output
            }
        }
        return JsonResponse(result)

    def validate_body(self, body):
        if "elements" not in body:
            return (False, ["JSON missing key: 'elements'"])

        errors = []
        for element_id, element_value in body["elements"].items():
            if not bool(element_value):
                errors.append("Element '%s' is empty" % element_id)
                continue
            if not isinstance(element_value, str):
                errors.append("Element '%s' does not have a string value" % element_id)
                continue

        if len(errors) > 0:
            return (False, errors)

        return (True, [])

    def colorize_elements(self, elements, color_attribute):
        return apicache.colorize_elements(elements, color_attribute)


# try to add getforms response
class GetFormsAPIView(BaseAPIView):
    def post(self, request):
        body = self.get_request_body_json(request)

        status = "success"
        message_for_status = {
            "error": "Internal server error"
        }
        try:
            text = body.get("text", "")
            lemma_data, lemma_level = lemmatizer.get_word_forms(text)
        except Exception as e:
            logger.exception(e)
            status = "error"

        result = {"status": status}
        if status == "success":
            result["data"] = lemma_data
            result["level"] = lemma_level
        if status in message_for_status:
            result["message"] = message_for_status[status]

        logger.debug("lemmatize response data=%s" % result)

        return JsonResponse(result, safe=False)