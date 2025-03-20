import hashlib
import json

from django.core.cache import cache

from . import htmlcolorizer, lemmatizer, tokenizer


def lemmatize_text(text):
    cache_key = "lemmatize_text:" + hashlib.md5(text.encode()).hexdigest()
    lemmatized_data = cache.get(cache_key)
    if lemmatized_data is None:
        lemmatized_data = lemmatizer.lemmatize_text(text)
        cache.set(cache_key, lemmatized_data)
    return lemmatized_data


def tokenize_and_tag(text):
    cache_key = "tokenize_and_tag:" + hashlib.md5(text.encode()).hexdigest()
    tokens = cache.get(cache_key)
    if tokens is None:
        tokens = tokenizer.tokenize_and_tag(text)
        cache.set(cache_key, tokens)
    return tokens


def colorize_html(html, color_attribute):
    cache_key = "colorize_html:" + hashlib.md5(color_attribute.encode() + html.encode()).hexdigest()
    output = cache.get(cache_key)
    if output is None:
        colorizer = htmlcolorizer.HtmlColorizer(html, color_attribute=color_attribute)
        output = colorizer.colorize()
        cache.set(cache_key, output)
    return output


def colorize_elements(elements, color_attribute):
    cache_key = "colorize_elements:" + hashlib.md5(json.dumps(elements, sort_keys=True).encode()).hexdigest()
    output = cache.get(cache_key)
    if output is None:
        colorizer = htmlcolorizer.HtmlElementsColorizer(elements, color_attribute=color_attribute)
        output = colorizer.colorize()
        cache.set(cache_key, output)
    return output
