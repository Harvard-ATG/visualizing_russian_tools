"""URL Configuration"""

from django.contrib import admin
from django.http import HttpResponse
from django.urls import path
from django.views.generic import TemplateView

import parser_tool.api
import parser_tool.views

urlpatterns = [
    path("", TemplateView.as_view(template_name="homepage.html"), name="home"),
    path("about", TemplateView.as_view(template_name="about.html"), name="about"),
    path("robots.txt", TemplateView.as_view(template_name="robots.txt", content_type="text/plain")),
    path("healthcheck", lambda r: HttpResponse("")),
    path("admin/", admin.site.urls),
    # Tool pages
    path("text-parsing-analysis", parser_tool.views.text_parsing_analysis, name="text_parsing_analysis"),
    path(
        "text-parsing-analysis-textbook",
        parser_tool.views.text_parsing_analysis,
        name="text_parsing_analysis_textbook",
        kwargs={"textbook_mode": True},
    ),
    path("html-colorizer", parser_tool.views.html_colorizer, name="html_colorizer"),
    path("mini-story-creator", parser_tool.views.mini_story_creator, name="mini_story_creator"),
    path("quick-lemma", parser_tool.views.quick_lemma, name="quick_lemma"),
    path("word-formation", parser_tool.views.word_formation, name="word_formation"),
    path("case-distribution", parser_tool.views.case_distribution, name="case_distribution"),
    path("verb-radar-chart", parser_tool.views.verb_radar_chart, name="verb_radar_chart"),
    path("similarity", parser_tool.views.similarity, name="similarity"),
    path("playing-with-matches", parser_tool.views.PlayingWithMatchesView.as_view(), name="playing_with_matches"),
    path("playing-with-matches-reset", parser_tool.views.playing_with_matches_reset, name="playing_with_matches_reset"),
    path("verb_histograms", parser_tool.views.verb_histograms, name="verb_histograms"),
    # API endpoints
    path("api/parsetext", parser_tool.api.TextParserAPIView.as_view(), name="api-parse-text"),
    path("api/lemmatize", parser_tool.api.LemmatizeAPIView.as_view(), name="api-lemmatize"),
    path("api/tokenize", parser_tool.api.TokenizeAPIView.as_view(), name="api-tokenize"),
    path("api/lemma", parser_tool.api.LemmaAPIView.as_view(), name="api-lemma"),
    path("api/colorize/html", parser_tool.api.DocumentColorizerAPIView.as_view(), name="api-colorize-html"),
    path("api/colorize/elements", parser_tool.api.ElementsColorizerAPIView.as_view(), name="api-colorize-elements"),
    # new path
    path("api/getforms", parser_tool.api.GetFormsAPIView.as_view(), name="api-get-forms"),
    path("api/getsimilarlsh", parser_tool.api.GetSimilarLSH.as_view(), name="api-similar-lsh"),
    path("api/getsimilarbruteforce", parser_tool.api.GetSimilarBruteForce.as_view(), name="api-similar-brute-force"),
]
