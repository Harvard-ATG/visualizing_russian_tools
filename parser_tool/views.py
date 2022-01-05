from django.shortcuts import render
from clancy_database import models
from json import dumps
from .forms import WordListForm
from utils import list_diff

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
    return render(request, 'parser_tool/spot_it.html')

def spot_it_options(request):
    if request.method == 'POST':
        form = WordListForm(request.POST)
        if form.is_valid():
            words = form.cleaned_data.get("words")
            qs_lemmas = models.Lemma.objects.filter(lemma__in=words)
            qs_only_lemmas = qs_lemmas.distinct().values_list('lemma', flat=True)
            not_found_words = [w for w in list_diff(qs_only_lemmas, words) if w !='']
            dict_lemmas =  [lemma.to_dict() for lemma in qs_lemmas]
            return render(request, 'parser_tool/spot_it_manual.html', {"data": dumps(dict_lemmas),"not_found_words": not_found_words})
        else:
            print(form.errors)
            return render(request, 'parser_tool/spot_it_options.html', {'form':form})
        # TODO make options for file upload
        # if request.method == 'POST' and request.FILES['upload']:
        # upload = request.FILES['upload']
        # word_list = upload.read().decode("utf-8").split("\n")
        # filtered_word_list = list(filter(lambda word: word != '', word_list))
        # print(f"list of words={filtered_word_list}")
        # qs_lemmas = models.Lemma.objects.filter(lemma__in=filtered_word_list)
        # dict_lemmas =  [lemma.to_dict() for lemma in qs_lemmas]
        # print(f"lemmas={dict_lemmas}")
        # dumps(dict_lemmas)
        # return render(request, 'parser_tool/spot_it_options.html',{'form':form})
    # return render(request, 'parser_tool/spot_it.html', {"data":dumps(dict_lemmas)})
    form = WordListForm()
    return render(request, 'parser_tool/spot_it_options.html', {'form':form})

def verb_histograms(request):
    return render(request, 'parser_tool/verb_histograms.html')
