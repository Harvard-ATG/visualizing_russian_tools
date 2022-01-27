from django.shortcuts import render
from clancy_database import models
import json
import logging
from .forms import WordListForm
from utils import list_diff

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

def spot_it(request):
    if request.method == 'POST':
        form = WordListForm(request.POST)
        if form.is_valid():
            words = form.cleaned_data.get("words")
            qs_lemmas = models.Lemma.objects.filter(lemma__in=words)
            qs_only_lemmas = qs_lemmas.distinct().values_list('lemma', flat=True)
            not_found_words = [w for w in list_diff(qs_only_lemmas, words) if w !='']
            dict_lemmas =  [lemma.to_dict() for lemma in qs_lemmas[:57]]
            return render(request, 'parser_tool/spot_it_start_game.html', {"data": json.dumps(dict_lemmas),"not_found_words": not_found_words})
        else:
            logger.warning(f"errors: {form.errors}")
            return render(request, 'parser_tool/spot_it_options.html', {'form':form})
    form = WordListForm()
    return render(request, 'parser_tool/spot_it_options.html', {'form':form})

def spot_it_reset(request):
    return render(request, 'parser_tool/spot_it_reset.html')

def verb_histograms(request):
    return render(request, 'parser_tool/verb_histograms.html')
