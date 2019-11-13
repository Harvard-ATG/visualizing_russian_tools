# -*- coding: utf-8 -*-
import unittest

from parser_tool import tokenizer, htmlcolorizer


def tokenize_and_tag_with_levels(text, levels=None):
    if levels is None:
        levels = {}
    tokens = tokenizer.tokenize_and_tag(text)
    for token in tokens:
        if token['tokentype'] == 'RUS':
            token['level'] = levels.get(token['canonical'], '1E')
        else:
            token['level'] = ''
    return tokens


class TestHtmlColorizer(unittest.TestCase):

    def test_scrub_html(self):
        input_html = '<p><strong>В</strong> <b><em>этом</em></b> <span style="font-weight:bold">году.</span></p>'
        expected_html = 'В этом году.'
        actual_html = htmlcolorizer.SCRUB_HTML_PATTERN.sub('', input_html)
        self.assertEqual(expected_html, actual_html)

    def test_get_doc_tokens(self):
        input_html = '<p><strong>В</strong> <b><em>этом</em></b> <span style="font-weight:bold">году.</span></p>'
        input_text = htmlcolorizer.SCRUB_HTML_PATTERN.sub('', input_html)
        expected_tokens = tokenizer.tokenize_and_tag(input_text)
        h = htmlcolorizer.HtmlColorizer(input_html)
        actual_tokens = h.get_doc_tokens()
        self.assertEqual(expected_tokens, actual_tokens)

    def test_colorize_plaintext(self):
        input_html = 'Это моя семья.'
        tokens = tokenize_and_tag_with_levels(input_html)
        tests = [
            (htmlcolorizer.COLOR_ATTR_STYLE, '<span><span style="color:green">Это</span> <span style="color:green">моя</span> <span style="color:green">семья</span>.</span>'),
            (htmlcolorizer.COLOR_ATTR_DATA, '<span><span data-level="1E">Это</span> <span data-level="1E">моя</span> <span data-level="1E">семья</span>.</span>'),
            (htmlcolorizer.COLOR_ATTR_CLASS, '<span><span class="wordlevel1">Это</span> <span class="wordlevel1">моя</span> <span class="wordlevel1">семья</span>.</span>'),
        ]

        for test in tests:
            (color_attribute, expected_html) = test
            h = htmlcolorizer.HtmlColorizer(input_html, color_attribute)
            actual_html = h.colorize({'tokens': tokens})
            self.assertEqual(expected_html, actual_html)

    def test_colorize_nested_tags(self):
        input_html = '<p><strong>В</strong> <b><em>этом</em></b> <span style="font-weight:bold">году.</span></p>'
        input_text = htmlcolorizer.SCRUB_HTML_PATTERN.sub('', input_html)
        tokens = tokenize_and_tag_with_levels(input_text)
        expected_html = '<p><strong><span><span data-level="1E">В</span></span></strong><span> </span><b><em><span><span data-level="1E">этом</span></span></em></b><span> </span><span style="font-weight:bold"><span><span data-level="1E">году</span>.</span></span></p>'

        h = htmlcolorizer.HtmlColorizer(input_html, htmlcolorizer.COLOR_ATTR_DATA)
        actual_html = h.colorize({'tokens': tokens})
        self.assertEqual(expected_html, actual_html)

    def test_colorize_broken_html(self):
        input_html = '<Это моя>'
        input_text = htmlcolorizer.SCRUB_HTML_PATTERN.sub('', input_html)
        tokens = tokenize_and_tag_with_levels(input_text)
        expected_html = '<span>&lt;Это моя&gt;</span>'

        h = htmlcolorizer.HtmlColorizer(input_html, htmlcolorizer.COLOR_ATTR_DATA)
        actual_html = h.colorize({'tokens': tokens})
        self.assertEqual(expected_html, actual_html)
