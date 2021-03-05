from django.shortcuts import render


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