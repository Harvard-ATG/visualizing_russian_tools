from django.shortcuts import render
from django.views.generic import View
from django.db.models import Q
from django.db.models.functions import Lower
import json
import logging

from clancy_database.models import Lemma
from .forms import WordListForm

logger = logging.getLogger(__name__)

def text_parsing_analysis(request):
    return render(request, 'parser_tool/text_parsing_analysis.html')


def mini_story_creator(request):
    return render(request, 'parser_tool/mini_story_creator.html')


def html_colorizer(request):
    return render(request, 'parser_tool/html_colorizer.html')


def quick_lemma(request):
    return render(request, 'parser_tool/quick_lemma.html')


def word_formation(request):
    return render(request, 'parser_tool/word_formation.html')


def case_distribution(request):
    return render(request, 'parser_tool/case_distribution.html')


def verb_radar_chart(request):
    return render(request, 'parser_tool/verb_radar_chart.html')

def similarity(request):
    return render(request, 'parser_tool/similarity.html')


class PlayingWithMatchesView(View):

    def _get_possible_words(self):
        qs_lemmas = Lemma.objects.filter(level='1E').order_by('rank').exclude(Q(icon_url__isnull=True) | Q(icon_url__exact=''))
        return list(qs_lemmas.values('lemma', 'rank'))

    def get(self, request):
        form = WordListForm()
        context = {
            'form':form,
            'possible_words': self._get_possible_words(),
        }
        return render(request, 'parser_tool/playing_with_matches_options.html', context)

    def post(self, request):
        form = WordListForm(request.POST)
        if form.is_valid():
            words = form.cleaned_data.get("words")
            qs_lemmas = Lemma.objects.filter(lemma__in=words)
            qs_only_lemmas = qs_lemmas.distinct().values_list('lemma', flat=True)
            not_found_words = set(qs_only_lemmas).symmetric_difference(set(words))
            not_found_words = [w for w in not_found_words if w != '']
            dict_lemmas =  [lemma.to_dict() for lemma in qs_lemmas[:57]]
            return render(request, 'parser_tool/playing_with_matches_start_game.html', {"data": json.dumps(dict_lemmas),"not_found_words": not_found_words})
        else:
            logger.warning(f"errors: {form.errors}")
            return render(request, 'parser_tool/playing_with_matches_options.html', {'form':form})


def playing_with_matches_reset(request):
    return render(request, 'parser_tool/playing_with_matches_reset.html')


def verb_histograms(request):
    return render(request, 'parser_tool/verb_histograms.html')
