import logging

from clancy_database import lemmatizer
from . import tokenizer

logger = logging.getLogger(__name__)

def parse(text):
    """
    Parses text returning a dictionary of tokens, each of which indexes into a table of forms and lemmas by ID.
    It should be possible to detoknize the data to get the original text.
    """
    # Tokenize and tag the text such that for each token we have: [(word, index, offset, tokentype, canonical_text), ...]
    tokens = tokenizer.tokenize(text)
    tokens = tokenizer.tag(tokens, taggers=[tokenizer.tokentype, tokenizer.canonical])
    #for t in tokens:
    #    logger.debug(str(t))

    # Lemmatize the russian tokens
    unique_canonical_tokens = list(set([token[4] for token in tokens if token[3] == tokenizer.TOKEN_RUS]))
    lemmatized = lemmatizer.makelookup(forms=unique_canonical_tokens)

    # Associate tokens with form database entries 
    tokens_with_forms = []
    for token in tokens:
        (tokentext, tokenidx, tokenoffset, tokentype, tokencanonical) = token
        token_data = {
            "token": tokentext, 
            "index": tokenidx, 
            "offset": tokenoffset, 
            "tokentype": tokentype,
            "canonical": tokencanonical,
            "form_ids": [],
            "level": ""
        }
        if tokentype == tokenizer.TOKEN_RUS:
            form_ids = lemmatized["lookup"].get(tokencanonical)
            if form_ids:
                form_id = form_ids[0]
                lemma_id = lemmatized["forms"][form_id]["lemma_id"]
                lemma = lemmatized["lemmas"][lemma_id]
                token_data["level"] = lemma["level"]
                token_data["form_ids"] = form_ids
                token_data["canonical"] = tokencanonical
        
        tokens_with_forms.append(token_data)

    # Aggregate all of the data, such that each token can be mapped to a form entry and by extension a lemma entry
    data = {
        "forms": lemmatized["forms"],
        "lemmas": lemmatized["lemmas"],
        "tokens": tokens_with_forms,
    }

    # Assertion: should be able to produce a copy of the original text from the tokens
    assert( tokenizer.is_equal(text, "".join([d["token"] for d in data["tokens"]])) )
    
    return data

