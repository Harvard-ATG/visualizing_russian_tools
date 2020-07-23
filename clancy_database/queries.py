import logging
from operator import itemgetter

from .models import Inflection, Lemma

logger = logging.getLogger(__name__)

BATCH_SIZE = 300

CYRILLIC_SMALL_LETTER_IE = '\u0435' # е
CYRILLIC_SMALL_LETTER_IO = '\u0451' # ё


def lookup_lemma(word=None, lemma_id=None):
    """
    Returns a list of lemmas as dicts if the given word or lemma ID matches.
    """
    if lemma_id is not None:
        queryset = Lemma.objects.filter(id=int(lemma_id))
    elif word is not None:
        queryset = Lemma.objects.filter(lemma=str(word))
    else:
        queryset = Lemma.objects.none()
    results = [lemma_object.to_dict() for lemma_object in queryset]
    return results


def variant_forms(form):
    """
    Returns a list of alternative forms based on spelling and/or case.
    Used to match against the database such as when ё is disguised as е.
    For example, зачёт may be written as зачет, in which case it's understood that the е is really ё.
    """
    variant_forms = [form.capitalize(), form.lower()]

    # check ё/е alternate spelling
    if CYRILLIC_SMALL_LETTER_IO in form:
        disguised_io_as_ie_form = form.replace(CYRILLIC_SMALL_LETTER_IO, CYRILLIC_SMALL_LETTER_IE)
        variant_forms.append(disguised_io_as_ie_form)

    # check multi-word expressions with or without comma
    if ' ' in form and ',' in form:
        variant_forms.append(form.replace(',', ''))

    return variant_forms


def query_multiple(forms):
    """
    Returns a queryset of Inflection objects that match the given forms.
    """
    # Construct the forms that should be used for querying purposes (variations on spelling and case)
    forms_to_query = []
    for form in forms:
        for variant_form in variant_forms(form):
            forms_to_query.append(variant_form)

    # Query database for set of matching forms
    logger.debug("forms_to_query: %s" % forms_to_query)
    # queryset = Inflection.objects.annotate(formlower=Lower('form')).filter(formlower__in=forms_to_query)
    queryset = Inflection.objects.filter(form__in=forms_to_query)
    return queryset


def makelookup(forms=None):
    """
    Returns dictionary of distinct database entries for inflections and lemmas (indexed by primary key)
    and a lookup that maps each form (lowercased) to a list of inflection PKs.

    This is intended for use cases where a large number of forms need to be identified and returned
    to the client.
    """
    logger.debug("makelookup(): number of forms: %s" % len(forms))
    table = {"forms": {}, "lemmas": {}, "lookup": {}}

    # Batch the DB queries to work around "sqlite3.OperationalError: too many SQL variables"
    for idx, forms in enumerate(batch(forms, n=BATCH_SIZE)):
        logger.debug("makelookup(): batch=%s forms=%s" % (idx, len(forms)))
        lemma_ids = set()

        # Find database entries for inflections matching the forms
        for inflection in query_multiple(forms):
            table["lookup"].setdefault(inflection.form.lower(), []).append(inflection.id)
            table["forms"][inflection.id] = inflection.to_dict()
            lemma_ids.add(inflection.lemma_id)

        # Find database entries for the lemmas
        logger.debug("makelookup(): batch=%s lemmas=%s" % (idx, len(lemma_ids)))
        for lemma in Lemma.objects.filter(id__in=list(lemma_ids)):
            table["lemmas"][lemma.id] = lemma.to_dict()

    # Sort the lookup so that form IDs are returned in order of level and rank
    # This is necessary since we didn't sort the forms when we queried the database
    table["lookup"] = sortlookup(table)
    logger.debug("makelookup(): table=%s" % table)

    return table


def sortlookup(table):
    """
    This function sorts the "lookup" dictionary in the table of forms/lemmas so that given a word form,
    the matching list of forms are sorted by level (e.g. 1E, 2I, 3A, ...) and then by rank (1.0, 2.0, ...).
    """
    sorted_lookup = {}
    for word in table["lookup"]:
        form_tuples = []
        for form_id in table["lookup"][word]:
            form = table["forms"][form_id]
            lemma = table["lemmas"][form["lemma_id"]]
            form_tuples.append((form_id, lemma["level"], lemma["rank"]))
        sorted_form_tuples = sorted(form_tuples, key=itemgetter(1, 2, 0))
        sorted_lookup[word] = [form_tuple[0] for form_tuple in sorted_form_tuples]
    return sorted_lookup


def lemmatize(form):
    """
    Returns the lemma or set of lemmas (if ambiguous) that matches a given form.
    """
    queryset = query_multiple([form])
    queryset = queryset.select_related('lemma').order_by('lemma__level', 'lemma__rank')
    lemmas = []
    seen = set()
    for inflection in queryset:
        lemma_id = inflection.lemma.id
        if lemma_id not in seen:
            seen.add(lemma_id)
            lemmas.append(inflection.lemma.to_dict())
    return lemmas

# TODO: write query to find 


def batch(iterable, n=1):
    """
    Utility function to slice an interable into batches of size n.
    """
    size = len(iterable)
    for i in range(0, size, n):
        yield iterable[i:min(i + n, size)]
