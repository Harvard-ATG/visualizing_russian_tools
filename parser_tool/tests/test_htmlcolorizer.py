# -*- coding: utf-8 -*-
import unittest

from parser_tool import htmlcolorizer, tokenizer


def tokenize_and_tag_with_levels(text, levels=None):
    if levels is None:
        levels = {}
    tokens = tokenizer.tokenize_and_tag(text)
    for token in tokens:
        if token["tokentype"] == "RUS":
            token["level"] = levels.get(token["canonical"], "1")
        else:
            token["level"] = ""
    return tokens


class TestHtmlColorizer(unittest.TestCase):
    def test_scrub_html(self):
        input_html = '<p><strong>В</strong> <b><em>этом</em></b> <span style="font-weight:bold">году.</span></p>'
        expected_html = "В этом году."
        actual_html = htmlcolorizer.SCRUB_HTML_PATTERN.sub("", input_html)
        self.assertEqual(expected_html, actual_html)

    def test_get_tokens(self):
        input_html = '<p><strong>В</strong> <b><em>этом</em></b> <span style="font-weight:bold">году.</span></p>'
        input_text = htmlcolorizer.SCRUB_HTML_PATTERN.sub("", input_html)
        expected_tokens = tokenizer.tokenize_and_tag(input_text)
        colorizer = htmlcolorizer.HtmlColorizer(input_html)
        actual_tokens = colorizer.get_tokens()
        self.assertEqual(expected_tokens, actual_tokens)

    def test_colorize_plaintext(self):
        input_html = "Это моя семья."
        expected_tokens = tokenize_and_tag_with_levels(input_html)
        tests = [
            ("style", '<span style="color:green">Это</span> <span style="color:green">моя</span> <span style="color:green">семья</span>.'),
            ("data", '<span data-level="1">Это</span> <span data-level="1">моя</span> <span data-level="1">семья</span>.'),
            ("class", '<span class="level1">Это</span> <span class="level1">моя</span> <span class="level1">семья</span>.'),
        ]

        for test in tests:
            (color_attribute, expected_html) = test
            colorizer = htmlcolorizer.HtmlColorizer(
                input_html, color_attribute=color_attribute, levels={t["canonical"]: t["level"] for t in expected_tokens}
            )
            actual_html = colorizer.colorize()
            self.assertEqual(expected_html, actual_html)

    def test_colorize_nested_tags(self):
        input_html = '<p><strong>В</strong> <b><em>этом</em></b> <span style="font-weight:bold">году.</span></p>'
        input_text = htmlcolorizer.SCRUB_HTML_PATTERN.sub("", input_html)
        expected_tokens = tokenize_and_tag_with_levels(input_text)
        expected_html = '<p><strong><span data-level="1">В</span></strong> <b><em><span data-level="1">этом</span></em></b> <span style="font-weight:bold"><span data-level="1">году</span>.</span></p>'

        colorizer = htmlcolorizer.HtmlColorizer(
            input_html, color_attribute="data", levels={t["canonical"]: t["level"] for t in expected_tokens}
        )
        actual_html = colorizer.colorize()

        self.assertEqual(expected_html, actual_html)

    def test_colorize_broken_html(self):
        input_html = "<Это моя>"
        input_text = htmlcolorizer.SCRUB_HTML_PATTERN.sub("", input_html)
        expected_tokens = tokenize_and_tag_with_levels(input_text)
        expected_html = "&lt;Это моя&gt;"

        colorizer = htmlcolorizer.HtmlColorizer(
            input_html, color_attribute="data", levels={t["canonical"]: t["level"] for t in expected_tokens}
        )
        actual_html = colorizer.colorize()
        self.assertEqual(expected_html, actual_html)


class TestHtmlElementsColorizer(unittest.TestCase):
    def test_colorize_multiple_elements(self):
        elements = {
            "8da35250": "Глава 1",
            "f7464298": "— Приве́т! Как тебя зову́т?",
            "2ff91b9b": "— Ле́на. А тебя?",
        }
        expected_tokens = tokenize_and_tag_with_levels(" ".join(elements.values()))
        expected_result = {
            "8da35250": '<span data-level="1">Глава</span> 1',
            "f7464298": '— <span data-level="1">Приве́т</span>! <span data-level="1">Как</span> <span data-level="1">тебя</span> <span data-level="1">зову́т</span>?',
            "2ff91b9b": '— <span data-level="1">Ле́на</span>. <span data-level="1">А</span> <span data-level="1">тебя</span>?',
        }
        colorizer = htmlcolorizer.HtmlElementsColorizer(
            elements, color_attribute="data", levels={t["canonical"]: t["level"] for t in expected_tokens}
        )
        actual_result = colorizer.colorize()

        self.assertEqual(sorted(expected_result.keys()), sorted(elements.keys()))
        for element_id in elements:
            self.assertEqual(expected_result[element_id], actual_result[element_id])

    def test_colorize_empty_elements(self):
        elements = {}
        colorizer = htmlcolorizer.HtmlElementsColorizer(elements, color_attribute="data", levels={})
        actual_result = colorizer.colorize()
        self.assertIsInstance(actual_result, dict)
        self.assertFalse(actual_result)
