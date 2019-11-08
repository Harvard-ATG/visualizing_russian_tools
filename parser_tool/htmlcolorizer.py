from bs4 import BeautifulSoup
from bs4.element import NavigableString
import re

from . import tokenizer


COLOR_ATTR_STYLE = 'style'
COLOR_ATTR_CLASS = 'class'
COLOR_ATTR_DATA = 'data'
COLOR_ATTR_CHOICES = (COLOR_ATTR_STYLE, COLOR_ATTR_CLASS, COLOR_ATTR_DATA)
COLOR_LIST = 'inherit,green,blue,indigo,orange,orange,black'.split(',') # for levels 0-6
DEFAULT_COLOR_ATTR = COLOR_ATTR_DATA
SCRUB_HTML_PATTERN = re.compile(r"<[^>]*>")


class HtmlColorizer:
    def __init__(self, html_doc, color_attribute=None):
        self.html_doc = html_doc
        self.soup = BeautifulSoup(html_doc, 'html.parser')

        if color_attribute in COLOR_ATTR_CHOICES:
            self.color_attribute = color_attribute
        else:
            self.color_attribute = DEFAULT_COLOR_ATTR

    def get_doc_tokens(self):
        text = SCRUB_HTML_PATTERN.sub('', self.html_doc)
        doc_tokens = tokenizer.tokenize_and_tag(text)
        return doc_tokens

    def colorize(self, lemmatized_data):
        canonical_token_levels = {t['canonical']: t['level'] for t in lemmatized_data['tokens']}
        self._colorize(canonical_token_levels)
        return str(self.soup)

    def _colorize(self, canonical_token_levels):
        text_nodes = []
        for child in self.soup.descendants:
            if not hasattr(child, 'children'):
                text_nodes.append(child)

        for text_node in text_nodes:
            text = str(text_node)
            tokens = tokenizer.tokenize_and_tag(text)
            token_elements = self.soup.new_tag('span')
            for token in tokens:
                token_level = canonical_token_levels.get(token['canonical'])
                if token_level:
                    token_level_int = int(token_level[0])
                    element = self.soup.new_tag("span")
                    element.string = token['token']
                    if self.color_attribute == COLOR_ATTR_DATA:
                        element['data-level'] = token_level
                    elif self.color_attribute == COLOR_ATTR_CLASS:
                        element['class'] = 'wordlevel'+str(token_level_int)
                    elif self.color_attribute == COLOR_ATTR_STYLE:
                        element['style'] = 'color:'+COLOR_LIST[token_level_int]
                else:
                    element = NavigableString(token['token'])
                token_elements.append(element)
            text_node.replace_with(token_elements.extract())
        return self
