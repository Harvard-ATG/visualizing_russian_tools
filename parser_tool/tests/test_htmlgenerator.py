# -*- coding: utf-8 -*-
import unittest
from xml.etree import ElementTree as ET

from parser_tool import htmlgenerator, tokenizer


class TestHtmlGenerator(unittest.TestCase):
    def _maketokendict(self, **kwargs):
        token_text = kwargs.get("token", "")
        token_dict = {
            "token": token_text,
            "index": kwargs.get("index", 0),
            "offset": kwargs.get("offset", 0),
            "tokentype": kwargs.get("tokentype", tokenizer.TOKEN_WORD),
            "canonical": kwargs.get("canonical", tokenizer.canonical(token_text)),
            "form_ids": kwargs.get("form_ids", []),
            "level": kwargs.get("level", ""),
        }
        return token_dict

    def test_render_token_russian_word(self):
        token_text = "первоку́рсник"
        token_dict = self._maketokendict(token=token_text, tokentype=tokenizer.TOKEN_RUS, level="3A", form_ids=["174128"])
        rendered = htmlgenerator.render_token(token_dict)
        node_type, el = rendered["node_type"], rendered["element"]

        self.assertEqual(htmlgenerator.ELEMENT_NODE, node_type)
        self.assertEqual("span", el.tag)
        self.assertEqual(
            {"class": "word parsed level3", "data-form-ids": ",".join(token_dict["form_ids"]), "data-level": token_dict["level"]}, el.attrib
        )
        self.assertEqual(token_text, el.text)

    def test_render_token_english_word(self):
        token_text = "hypothetical"
        token_dict = self._maketokendict(token=token_text, tokentype=tokenizer.TOKEN_WORD)
        rendered = htmlgenerator.render_token(token_dict)
        node_type, el = rendered["node_type"], rendered["element"]

        self.assertEqual(htmlgenerator.ELEMENT_NODE, node_type)
        self.assertEqual("span", el.tag)
        self.assertEqual({"class": "word"}, el.attrib)
        self.assertEqual(token_text, el.text)

    def test_render_token_with_multiple_spaces(self):
        token_text = " " * 3
        expected_text = token_text.replace("  ", "\u00a0\u00a0")
        token_dict = self._maketokendict(token=token_text, tokentype=tokenizer.TOKEN_SPACE)
        rendered = htmlgenerator.render_token(token_dict)

        self.assertEqual(htmlgenerator.TEXT_NODE, rendered["node_type"])
        self.assertEqual(expected_text, rendered["text"])

    def test_render_token_with_punctuation(self):
        token_text = "')."
        expected_text = token_text
        token_dict = self._maketokendict(token=token_text, tokentype=tokenizer.TOKEN_SPACE)
        rendered = htmlgenerator.render_token(token_dict)

        self.assertEqual(htmlgenerator.TEXT_NODE, rendered["node_type"])
        self.assertEqual(expected_text, rendered["text"])

    def test_tokens_with_leading_punct_to_html(self):
        # (собака) dog
        tokens = [
            self._maketokendict(token="(", tokentype=tokenizer.TOKEN_PUNCT),
            self._maketokendict(token="собака", tokentype=tokenizer.TOKEN_RUS, level="1E", form_ids=["7599"]),
            self._maketokendict(token=")", tokentype=tokenizer.TOKEN_RUS),
            self._maketokendict(token=" ", tokentype=tokenizer.TOKEN_SPACE),
            self._maketokendict(token="dog", tokentype=tokenizer.TOKEN_WORD),
        ]
        html = htmlgenerator.tokens2html(tokens)
        expected_html = (
            '<pre class="words">('
            '<span data-form-ids="7599" data-level="1E" class="word parsed level1">собака</span>'
            '<span class="word">)</span> <span class="word">dog</span></pre>'
        )
        self.assertEqual(expected_html, html)

    def test_tokens2html(self):
        tokens = [
            self._maketokendict(token="A", tokentype=tokenizer.TOKEN_WORD),
            self._maketokendict(token=" ", tokentype=tokenizer.TOKEN_SPACE),
            self._maketokendict(token="первоку́рсник", tokentype=tokenizer.TOKEN_RUS, level="3A", form_ids=["174128"]),
            self._maketokendict(token=" ", tokentype=tokenizer.TOKEN_SPACE),
            self._maketokendict(token="|", tokentype=tokenizer.TOKEN_PUNCT),
            self._maketokendict(token="первоку́рсница", tokentype=tokenizer.TOKEN_RUS, level="3A", form_ids=["174128"]),
            self._maketokendict(token=" ", tokentype=tokenizer.TOKEN_SPACE),
        ]
        html = htmlgenerator.tokens2html(tokens)
        root = ET.fromstring(html)

        # Check the root element (e.g. container)
        self.assertEqual("pre", root.tag)
        self.assertEqual({"class": "words"}, root.attrib)

        # Check that we have the expected number of child elements (1 element for each word or russian token)
        expected_word_elements = sum([1 for t in tokens if t["tokentype"] in (tokenizer.TOKEN_WORD, tokenizer.TOKEN_RUS)])
        self.assertEqual(expected_word_elements, len(root))

        # Now check the first few tokens...
        # 1) Check that the first child contains the text of the first token
        self.assertEqual(tokens[0]["token"], root[0].text)
        self.assertEqual("span", root[0].tag)
        self.assertEqual({"class": "word"}, root[0].attrib)
        # 2) Check that the first child's tail contains the text of the second token since it's a space token
        self.assertEqual(tokens[1]["token"], root[0].tail)
        # 3) Check that the second child contains the text of the third token
        self.assertEqual(tokens[2]["token"], root[1].text)
        self.assertEqual("span", root[1].tag)
        self.assertEqual({"class": "word parsed level3", "data-form-ids": "174128", "data-level": "3A"}, root[1].attrib)
