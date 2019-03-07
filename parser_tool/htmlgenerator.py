import io
import re
import logging
from xml.etree import ElementTree as ET

from . import tokenizer

logger = logging.getLogger(__name__)

RE_CONSECUTIVE_SPACES = re.compile("[ ]{2,}", flags=re.MULTILINE)

ELEMENT_NODE = 1
TEXT_NODE = 3

def tokens2html(tokens=None, **options):
    """
    Transforms a list of tokens to HTML.
    Example:
        <div class="words">
            <span class="word parsed level1" data-level="1E" data-form-ids="100,200">Все</span> 
            <span class="word parsed level1" data-level="1E" data-form-ids="12500,12502" >счастливые</span>
        </div>
    """
    if tokens is None:
        tokens = []

    container_el = ET.Element('div', attrib={"class": options.get("containerCls", "words")})
    prev_el = None
    for token in tokens:
        rendered = render_token(token)
        print(rendered)
        #logger.debug(rendered)
        if rendered['node_type'] == ELEMENT_NODE:
            container_el.append(rendered['element'])
            prev_el = rendered['element']
        elif rendered['node_type'] == TEXT_NODE:
            if prev_el is None:
                container_el.text = rendered['text'] if container_el.text is None else container_el.text + rendered['text'] 
            else:
                prev_el.tail = rendered['text'] if prev_el.tail is None else prev_el.tail + rendered['text'] 

    # Serialize HTML to string
    textstream = io.BytesIO()
    ET.ElementTree(container_el).write(textstream, encoding="utf-8", method='html')
    html = textstream.getvalue().decode("utf-8")
    html = linebreaks(html)

    return html

def linebreaks(text):
    return text.replace("\n", "<br>").replace("\r", "<br>")

def render_token(token):
    token_text = token['token']
    if token['tokentype']  in (tokenizer.TOKEN_PUNCT, tokenizer.TOKEN_SPACE):
        token_text = token_text.replace("  ", "\u00A0\u00A0")
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