from django.http import JsonResponse, HttpResponseBadRequest
from django.core.exceptions import SuspiciousOperation
from django.views import View
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from clancy_database.lemmatize import lemmatize

import json

class LemmatizeAPIView(View):
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
        forms = [token['lexeme'] for token in tokens if token['lexeme'] != ""]
        lemmatized = lemmatize(list(set(forms)))

        results = []
        for token in tokens:
            lexeme = token['lexeme']
            if lexeme in lemmatized:
                for item in lemmatized[lexeme]:
                    result = item.copy()
                    result['element'] = token['id']
                    results.append(result)

        return results

lemmatize_api_view = csrf_exempt(LemmatizeAPIView.as_view())
