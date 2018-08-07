from django.http import JsonResponse, HttpResponseBadRequest
from django.core.exceptions import SuspiciousOperation
from django.views import View
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import Lemma, Inflection

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
        lexemes = list(set([token['lexeme'] for token in tokens]))

        lemmatized = {}
        qs = Inflection.objects.filter(form__in=lexemes).prefetch_related('lemma')
        for inflection in qs:
            details = {
                "inflection": {
                    "type": inflection.type,
                    "label": inflection.form,
                    "stressed": inflection.stressed,
                },
                "lemma": {
                    "stressed": inflection.lemma.stressed,
                    "gender": inflection.lemma.gender,
                    "pos": inflection.lemma.pos,
                    "level": inflection.lemma.level,
                    "count": inflection.lemma.count,
                    "rank": inflection.lemma.rank,
                    "animacy": inflection.lemma.animacy,
                    "label": inflection.lemma.lemma,
                    "id": inflection.lemma.external_id,
                    "reverse": "",
                }
            }
            lemmatized.setdefault(inflection.form, []).append(details)

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