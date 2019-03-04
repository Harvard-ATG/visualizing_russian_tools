import io
from xml.etree import ElementTree as ET

from . import tokenizer

def tokens2html(tokens=None, **options):
    """
    Transforms a list of tokens to HTML in which each token.
    Example:
        <div class="parsedtext">
            <span class="word parsed" data-level="1E" data-form-ids="100,200">Все</span>
            <span> </span>
            <span class="word parsed" data-level="1E" data-form-ids="12500,12502" >счастливые</span>
        </div>
    """
    if tokens is None:
        tokens = []

    container = ET.Element('div', attrib={"class": "words"})
    prev_el = None
    for token in tokens:
        # When processing tokens, we assume that every other token is a "space" token.
        # Words need to be wrapped in SPAN elements for styling and data purposes, but
        # whitespace and punctuation can be represented as text nodes.
        token_text = token['token']
        if token['tokentype'] in (tokenizer.TOKEN_RUS, tokenizer.TOKEN_NUM):
            attrib = {} 
            attribCls = []
            if token['tokentype'] == tokenizer.TOKEN_RUS:
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
            container.append(el)
            prev_el = el
        else:  
            # Assume consecutive whitespace is significant, so use non-breaking spaces
            if len(token_text) > 1:
                token_text = token_text.replace(" ", "\u00A0") # U+00A0 is nbsp
            if prev_el is None:
                container.text = token_text
            else:
                prev_el.tail = token_text

    # Serialize HTML to string
    textstream = io.BytesIO()
    ET.ElementTree(container).write(textstream, encoding="utf-8", method='html')
    html = textstream.getvalue().decode("utf-8")
    html = linebreaks(tabs((html)))

    return html

def linebreaks(text):
    return text.replace("\n", "<br>").replace("\r", "<br>")

def tabs(text):
    return text.replace("\t", "&nbsp;&nbsp;&nbsp;&nbsp")

