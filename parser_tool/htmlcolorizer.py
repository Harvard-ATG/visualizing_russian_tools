import re

from bs4 import BeautifulSoup
from bs4.element import NavigableString

from . import lemmatizer, tokenizer

# List of colors to use when applying as an inline style
COLOR_LIST = ["inherit", "green", "blue", "indigo", "orange", "orange", "black"]  # for levels 0-6

# Define color choices, either apply as an inline style, a class or data attribute
COLOR_ATTR_STYLE = "style"
COLOR_ATTR_CLASS = "class"
COLOR_ATTR_DATA = "data"
COLOR_ATTR_CHOICES = (COLOR_ATTR_STYLE, COLOR_ATTR_CLASS, COLOR_ATTR_DATA)
DEFAULT_COLOR_ATTR = COLOR_ATTR_DATA

# Regex patterns
SCRUB_HTML_PATTERN = re.compile(r"<[^>]*>")


class DocumentColorizer:
    """
    Abstract class used to colorize the words in a document according to the difficulty level of the lemma.
    """

    def __init__(self, doc, **options):
        self.doc = doc
        self.options = options
        self.levels = options.get("levels", None)
        self.color_attribute = options.get("color_attribute", DEFAULT_COLOR_ATTR)

    def colorize(self):
        """Returns the colorized doocument."""
        raise NotImplementedError()

    def get_text(self):
        """Returns complete text of the document."""
        raise NotImplementedError()

    def get_tokens(self):
        """Returns a complete list of tokens from the document."""
        doc_text = self.get_text()
        return tokenizer.tokenize_and_tag(doc_text)

    def get_levels(self):
        """Returns a dict() mapping each token to its level."""
        if self.levels is None:
            doc_tokens = self.get_tokens()
            doc_lemmatized = lemmatizer.lemmatize_tokens(doc_tokens)
            self.levels = {t["canonical"]: t["level"] for t in doc_lemmatized["tokens"] if t["level"]}
        return self.levels

    def get_color_attribute(self):
        if self.color_attribute not in COLOR_ATTR_CHOICES:
            return DEFAULT_COLOR_ATTR
        return self.color_attribute


class HtmlColorizer(DocumentColorizer):
    """
    Colorize words in an HTML document.
    """

    def __init__(self, doc, **options):
        super().__init__(doc, **options)

    def get_text(self):
        """Returns text from the document."""
        text = SCRUB_HTML_PATTERN.sub("", self.doc)
        return text

    def colorize(self):
        levels = self.get_levels()
        color_attribute = self.get_color_attribute()
        soup = self._make_beautiful_soup()
        text_nodes = []

        # First extract all the text nodes from the html document
        for child in soup.descendants:
            if not hasattr(child, "children"):
                text_nodes.append(child)

        # Then replace each text node with one or more span elements that colorizes each word
        for text_node in text_nodes:
            tokens = tokenizer.tokenize_and_tag(str(text_node))
            token_elements = []
            for token in tokens:
                token_level = levels.get(token["canonical"])
                if token_level:
                    token_level_int = int(token_level[0])
                    element = soup.new_tag("span")
                    element.string = token["token"]
                    if color_attribute == COLOR_ATTR_DATA:
                        element["data-level"] = str(token_level_int)
                    elif color_attribute == COLOR_ATTR_CLASS:
                        element["class"] = "level" + str(token_level_int)
                    elif color_attribute == COLOR_ATTR_STYLE:
                        element["style"] = "color:" + COLOR_LIST[token_level_int]
                else:
                    element = NavigableString(token["token"])
                token_elements.append(element)

            text_node.insert_before(*token_elements)
            text_node.extract()  # remove text node

        colorized_html = str(soup)
        return colorized_html

    def _make_beautiful_soup(self):
        return BeautifulSoup(self.doc, "html.parser")


class HtmlElementsColorizer(DocumentColorizer):
    """
    Colorizes elements in an HTML document.

    The elements should be provided as a dictionary of elements where the key is an identifier
    in the DOM and the value is the inner content of that element.
    """

    def __init__(self, doc, **options):
        super().__init__(doc, **options)  # doc is a dict mapping element IDs to strings

    def get_text(self):
        """Returns text from all elements."""
        text = " ".join(self.doc.values())
        return text

    def colorize(self):
        levels = self.get_levels()
        colorized_elements = {element_id: self._colorize_element(value, levels) for element_id, value in self.doc.items()}
        return colorized_elements

    def _colorize_element(self, element, levels):
        options = dict(self.options)
        options["levels"] = levels
        html_colorizer = HtmlColorizer(element, **options)
        return html_colorizer.colorize()
