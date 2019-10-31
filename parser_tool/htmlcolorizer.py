from bs4 import BeautifulSoup
from bs4.element import NavigableString
from parser_tool import tokenizer


class HtmlColorizer:
    def __init__(self, html_doc):
        self.html_doc = html_doc
        self.soup = BeautifulSoup(html_doc, 'html.parser')

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

    def _colorize(self, canonical_token_levels, style_options=None):
        if style_options is None:
            style_options = {}
        style_options.setdefault('applycolor', 'inline')
        style_options.setdefault('colors', 'inherit,green,blue,indigo,orange,orange,black'.split(','))
        if style_options.get('applycolor') not in ('data_attribute', 'inline'):
            raise Exception("must specify either data attribute or inline for applying the color")
        if len(style_options['colors']) != 7:
            raise Exception("must provide list of colors for levels 0-6")

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
                    if style_options['applycolor'] == 'data_attribute':
                        element['data-level'] = token_level
                    else:
                        element['style'] = 'color:'+style_options['colors'][token_level_int]
                else:
                    element = NavigableString(token['token'])
                token_elements.append(element)
            text_node.replace_with(token_elements.extract())
        return self

    def output(self, pretty=False):
        if pretty:
            return self.soup.prettify()
        return str(self.soup)
