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

    # Setup container div
    container = ET.Element('div', attrib={"class": "words"})

    # Create span elements for each token
    for token in tokens:
        attrib = {} 
        attribCls = []
        if token['tokentype'] == tokenizer.TOKEN_RUS:
            attribCls.append("word")
        if len(token['form_ids']) > 0:
            attribCls.append("parsed")
            attrib['data-form-ids'] = ",".join([str(x) for x in token['form_ids']])
        if token['level']:
            attrib['data-level'] = token['level']
            attrib.setdefault('class', '')
            attribCls.append("level%s" % token['level'][0])
        if len(attribCls) > 0:
            attrib['class'] = " ".join(attribCls)
        el = ET.Element('span', attrib=attrib)
        el.text = token['token']
        container.append(el)

    # Serialize HTML to string
    textstream = io.BytesIO()
    ET.ElementTree(container).write(textstream, encoding="utf-8", method='html')
    html = textstream.getvalue().decode("utf-8")
    html = linebreaks(tabs(html))

    return html

def linebreaks(text):
    return text.replace("\n", "<br>").replace("\r", "<br>")

def tabs(text):
    return text.replace("\t", "&nbsp;&nbsp;&nbsp;&nbsp")
