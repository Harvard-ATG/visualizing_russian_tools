from django.shortcuts import render

def text_parsing_analysis(request):
    return render(request, 'parser_tool/text_parsing_analysis.html')

def mini_story_creator(request):
    return render(request, 'parser_tool/mini_story_creator.html')

def html_colorizer(request):
    return render(request, 'parser_tool/html_colorizer.html')
