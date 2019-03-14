import logging
from django.db.models.functions import Lower

from .models import Inflection, Lemma

logger = logging.getLogger(__name__)

BATCH_SIZE = 300

def query_multiple(forms):
    """
    Returns a queryset of Inflection objects that match the given forms.
    """
    # Ensure that we match capitalized forms in the DB for some entries (e.g. России).
    # Sqlite doesn't work well with the annotated filter, so using this to cheat a bit.
    # Migrating to postgres should make this hack unnecessary.
    forms = list(forms) + [s.capitalize() for s in forms] 

    # Query database for set of matching forms
    queryset = Inflection.objects.annotate(formlower=Lower('form')).filter(formlower__in=forms)
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

    return table


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

def batch(iterable, n=1):
    """
    Utility function to slice an interable into batches of size n.
    """
    size = len(iterable)
    for i in range(0, size, n):
        yield iterable[i : min(i + n, size)]
