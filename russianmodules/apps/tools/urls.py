from django.urls import path, include
from . import views

urlpatterns = [
    path('text-parsing-analysis', views.text_parsing_analysis, name='text_parsing_analysis'),
]
