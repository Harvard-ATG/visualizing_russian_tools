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
    path('api/parsetext', parser_tool.api.text_parser_api_view, name='parse-text')
]
