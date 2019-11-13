"""URL Configuration"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

import parser_tool.views
import parser_tool.api

urlpatterns = [
    path('', TemplateView.as_view(template_name='homepage.html'), name='home'),
    path('robots.txt', TemplateView.as_view(template_name='robots.txt', content_type='text/plain')),
    path('admin/', admin.site.urls),
    path('text-parsing-analysis', parser_tool.views.text_parsing_analysis,  name='text_parsing_analysis'),
    path('html-colorizer', parser_tool.views.html_colorizer,  name='html_colorizer'),
    path('mini-story-creator', parser_tool.views.mini_story_creator,  name='mini_story_creator'),
    path('api/parsetext', parser_tool.api.text_parser_api_view, name='api-parse-text'),
    path('api/colorizehtml', parser_tool.api.html_colorizer_api_view, name='api-parse-html'),
    path('api/lemmatize', parser_tool.api.lemmatize_api_view, name='api-lemmatize'),
    path('api/tokenize', parser_tool.api.tokenize_api_view, name='api-tokenize'),
    path('api/lemma', parser_tool.api.lemma_api_view, name='api-lemma'),
]
