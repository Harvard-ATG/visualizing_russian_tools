from django.shortcuts import render

def text_parsing_analysis(request):
    return render(request, 'tools/text_parsing_analysis.html')
