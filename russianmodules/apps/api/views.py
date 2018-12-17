from django.http import JsonResponse, HttpResponseBadRequest
from django.core.exceptions import SuspiciousOperation
from django.views import View
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import lemmatize

import json

class ApiView(View):
    def get(self, request):
        return JsonResponse({"lemmatize": reverse('api:lemmatize') })

class LemmatizeView(View):
    def post(self, request):
        if request.content_type != 'application/json':
            raise HttpResponseBadRequest
        try:
            tokens = json.loads(request.body.decode('utf-8'))
        except ValueError:
            raise SuspiciousOperation('Invalid JSON')
        results = self._parse(tokens)
        return JsonResponse(results, safe=False)

    def _parse(self, tokens):
        forms = list(set([token['lexeme'] for token in tokens if token['lexeme'] != ""]))
        lemmatized = lemmatize(forms)

        results = []
        for token in tokens:
            lexeme = token['lexeme']
            if lexeme in lemmatized:
                for item in lemmatized[lexeme]:
                    result = item.copy()
                    result['element'] = token['id']
                    results.append(result)

        return results

api_view = ApiView.as_view()
lemmatize_view = csrf_exempt(LemmatizeView.as_view())
