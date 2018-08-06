from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.api_view, name='root'),
    path('lemmatize', views.lemmatize_view, name='lemmatize'),
]
