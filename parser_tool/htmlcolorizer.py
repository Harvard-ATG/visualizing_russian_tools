from bs4 import BeautifulSoup
from bs4.element import NavigableString
from . import tokenizer


class HtmlColorizer:
    def __init__(self, html_doc):
        self.html_doc = html_doc
        self.soup = BeautifulSoup(html_doc, 'html.parser')
        self.color_attribute = "style"
        self.color_list = 'inherit,green,blue,violet,orange,orange,black'.split(',') # must provide list of colors for levels 0-6

    def set_color_attribute(self, attribute):
        if attribute not in ('style', 'class', 'data'):
            return False
        self.color_attribute = attribute

    def set_colors(self, color_str):
        color_list = color_str.split(',')
        if len(color_list) != 7:
            return False
        self.color_list = color_list

    def get_doc_tokens(self):
        doc_tokens = []
        for child in self.soup.descendants:
            if not hasattr(child, 'children'):
                child_tokens = tokenizer.tokenize_and_tag(str(child))
                doc_tokens.extend(child_tokens)
        return doc_tokens

    def colorize(self, lemmatized_data):
        canonical_token_levels = {t['canonical']: t['level'] for t in lemmatized_data['tokens']}
        return self._colorize(canonical_token_levels)

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
                    if self.color_attribute == 'data':
                        element['data-level'] = token_level
                    elif self.color_attribute == 'class':
                        element['class'] = 'wordlevel'+str(token_level_int)
                    elif self.color_attribute == 'style':
                        element['style'] = 'color:'+self.color_list[token_level_int]
                else:
                    element = NavigableString(token['token'])
                token_elements.append(element)
            text_node.replace_with(token_elements.extract())
        return self

    def output(self, pretty=False):
        if pretty:
            return self.soup.prettify()
        return str(self.soup)
