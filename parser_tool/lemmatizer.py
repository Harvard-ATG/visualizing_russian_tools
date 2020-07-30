import logging

from clancy_database import queries

from . import tokenizer

logger = logging.getLogger(__name__)


def lookup_lemma_by_word(word):
    return queries.lookup_lemma(word=word)


def lookup_lemma_by_id(lemma_id):
    return queries.lookup_lemma(lemma_id=lemma_id)


def lemmatize_word(word):
    return queries.lemmatize(word)


def lemmatize_text(text):
    """
    Lemmatizes a text.
    Returns a dictionary with entries for forms, lemmas, and tokens.
    """
    tokens = tokenizer.tokenize_and_tag(text)
    data = lemmatize_tokens(tokens)
    assert(tokenizer.is_equal(text, "".join([d["token"] for d in data["tokens"]])))  # should be able to detokenize
    return data


def lemmatize_tokens(tokens):
    """
    Lemmatizes a list of tokens.
    Returns a dictionary with entries for forms, lemmas, and tokens.
    """
    unique_canonical_tokens = list(set([t['canonical'] for t in tokens if t['tokentype'] == tokenizer.TOKEN_RUS]))
    logger.debug(unique_canonical_tokens)
    lemmatized = queries.makelookup(forms=unique_canonical_tokens)

    for token in tokens:
        token["form_ids"] = []
        token["level"] = ""
        if token["tokentype"] == tokenizer.TOKEN_RUS:
            lookup_form = None

            # Get all variations on the canonical form that could have matched the database
            # and try to find the first variant that is in the lookup table.
            variant_forms = queries.variant_forms(token["canonical"])
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
                    # new attribute for token
                    token["count"] = lemmatized["forms"][form_id]["frequency"];
                    token["label"] = lemma["label"];

    # Aggregate all of the data, such that each token can be mapped to a form entry and by extension a lemma entry
    data = {
        "forms": lemmatized["forms"],
        "lemmas": lemmatized["lemmas"],
        "tokens": tokens,
    }

    return data

def get_word_forms(text):
    tokens = tokenizer.tokenize(text)
    lemmas = [queries.lemmatize(tokens[0]) for token in tokens][0]
    ids = [lemma["id"] for lemma in lemmas]
    return queries.getforms(ids)
