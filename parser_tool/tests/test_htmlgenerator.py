# -*- coding: utf-8 -*-
import unittest
from parser_tool import tokenizer, htmlgenerator

class TestHtmlGenerator(unittest.TestCase):
    
    def _maketoken(self, **kwargs):
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
        token_dict = self._maketoken(token="первоку́рсник", tokentype=tokenizer.TOKEN_RUS, level="3A", form_ids=["174128"])
        rendered = htmlgenerator.render_token(token_dict)
        node_type, el = rendered['node_type'], rendered['element']

        # Check element
        self.assertEqual(htmlgenerator.ELEMENT_NODE, node_type)
        self.assertEqual("span", el.tag)

        # Check element attributes
        for attribute in ("class", "data-form-ids", "data-level"):
            self.assertIn(attribute, el.attrib)
        self.assertEqual("word parsed level3", el.attrib['class'])
        self.assertEqual(",".join(token_dict['form_ids']), el.attrib['data-form-ids'])
        self.assertEqual(token_dict['level'], el.attrib['data-level'])
        