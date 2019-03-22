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
    tokens = tokenizer.tag(tokens)
    for token in tokens:
        logger.debug(token)

    # Lemmatize the russian tokens
    unique_canonical_tokens = list(set([t['canonical'] for t in tokens if t['tokentype'] == tokenizer.TOKEN_RUS]))
    logger.debug(unique_canonical_tokens)
    lemmatized = lemmatizer.makelookup(forms=unique_canonical_tokens)

    # Associate tokens with form database entries 
    for token in tokens:
        token["form_ids"] = []
        token["level"] = ""
        if token["tokentype"] == tokenizer.TOKEN_RUS:
            lookup_form = None

            # Get all variations on the canonical form that could have matched the database
            # and try to find the first variant that is in the lookup table.
            variant_forms = lemmatizer.get_variant_forms(token["canonical"])
            for variant_form in variant_forms:
                if variant_form in lemmatized["lookup"]:
                    lookup_form = variant_form
                    break
            
            # Perform the lookup and assign attributes to the token
            if lookup_form is not None:
                form_ids = lemmatized["lookup"].get(lookup_form)
                if form_ids:
                    form_id = form_ids[0]
                    lemma_id = lemmatized["forms"][form_id]["lemma_id"]
                    lemma = lemmatized["lemmas"][lemma_id]
                    token["level"] = lemma["level"]
                    token["form_ids"] = form_ids

    # Aggregate all of the data, such that each token can be mapped to a form entry and by extension a lemma entry
    data = {
        "forms": lemmatized["forms"],
        "lemmas": lemmatized["lemmas"],
        "tokens": tokens,
    }

    # Assertion: should be able to produce a copy of the original text from the tokens
    assert( tokenizer.is_equal(text, "".join([d["token"] for d in data["tokens"]])) )
    
    return data

