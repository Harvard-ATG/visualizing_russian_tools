from django.shortcuts import render
from clancy_database import models
from json import dumps
from .forms import wordForm

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
    # if request.method == 'POST' and request.FILES['upload']:
    if request.method == 'POST':
        form = wordForm(request.POST)
        if form.is_valid():
            words= form.cleaned_data.get("words")
            split_words = words.split('\r\n')
            qs_lemmas = models.Lemma.objects.filter(lemma__in=split_words)
            dict_lemmas =  [lemma.to_dict() for lemma in qs_lemmas]
            return render(request, 'parser_tool/spot_it_manual.html', {"data":dumps(dict_lemmas)})
        # TODO make options for file upload
        # upload = request.FILES['upload']
        # word_list = upload.read().decode("utf-8").split("\n")
        # filtered_word_list = list(filter(lambda word: word != '', word_list))
        # print(f"list of words={filtered_word_list}")
        # qs_lemmas = models.Lemma.objects.filter(lemma__in=filtered_word_list)
        # dict_lemmas =  [lemma.to_dict() for lemma in qs_lemmas]
        # print(f"lemmas={dict_lemmas}")
        # dumps(dict_lemmas)
        # TODO display message if word count < require amount or if word count > required word count
        # return render(request, 'parser_tool/spot_it_options.html',{'form':form})
    # return render(request, 'parser_tool/spot_it.html', {"data":dumps(dict_lemmas)})
    form = wordForm()
    return render(request, 'parser_tool/spot_it_options.html', {'form':form})