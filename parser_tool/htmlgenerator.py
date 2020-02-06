import io
import logging
from xml.etree import ElementTree as ET

from . import tokenizer

logger = logging.getLogger(__name__)

ELEMENT_NODE = 1
TEXT_NODE = 3


def tokens2html(tokens, **options):
    """
    Transforms a list of tokens to HTML.
    Example:
        <div class="words">
            <span class="word parsed level1" data-level="1E" data-form-ids="100,200">Все</span>
            <span class="word parsed level1" data-level="1E" data-form-ids="12500,12502" >счастливые</span>
        </div>
    """

    # Add tokens to element tree
    # Note: intentionally using "pre" so that tab characters can be rendered properly
    container_el = ET.Element('pre', attrib={"class": options.get("containerCls", "words")})
    prev_el = container_el

    for token in tokens:
        rendered = render_token(token)
        if rendered['node_type'] == ELEMENT_NODE:
            container_el.append(rendered['element'])
            prev_el = rendered['element']
        elif rendered['node_type'] == TEXT_NODE:
            text_attribute = 'text' if prev_el is None else 'tail'
            starting_text = getattr(prev_el, text_attribute, '') or ''
            setattr(prev_el, text_attribute, starting_text + rendered['text'])

    # Serialize element tree to HTML string
    html = serialize(container_el)
    # html = newline2br(html) # commented out because switched to "pre" tag

    return html


def serialize(root_el):
    textstream = io.BytesIO()
    ET.ElementTree(root_el).write(textstream, encoding="utf-8", method='html')
    html = textstream.getvalue().decode("utf-8")
    return html


def newline2br(text):
    return text.replace("\n", "<br>")


def render_token(token):
    token_text = token['token']
    if token['tokentype'] in (tokenizer.TOKEN_PUNCT, tokenizer.TOKEN_SPACE):
        token_text = token_text.replace("\r", "\n")  # normalize returns as newlines
        token_text = token_text.replace("\t", "\u0009")  # render tab entities
        token_text = token_text.replace("  ", "\u00A0\u00A0")  # render 2 consecutive spaces as nbsp
        return {'node_type': TEXT_NODE, 'text': token_text}

    attrib = {}
    attribCls = []
    if token['tokentype'] in (tokenizer.TOKEN_WORD, tokenizer.TOKEN_RUS):
        attribCls.append("word")
    if len(token['form_ids']) > 0:
        attribCls.append("parsed")
        attrib['data-form-ids'] = ",".join([str(x) for x in token['form_ids']])
    if token['level']:
        attribCls.append("level%s" % token['level'][0])
        attrib['data-level'] = token['level']
    if len(attribCls) > 0:
        attrib['class'] = " ".join(attribCls)

    el = ET.Element('span', attrib=attrib)
    el.text = token_text

    return {'node_type': ELEMENT_NODE, 'element': el}
