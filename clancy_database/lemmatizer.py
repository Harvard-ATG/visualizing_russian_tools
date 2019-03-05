from django.db.models.functions import Lower

from .models import Inflection, Lemma


def get_inflections_queryset(forms):
    # Ensure that we match capitalized forms in the DB for some entries (e.g. России).
    # Sqlite doesn't work well with the annotated filter, so using this to cheat a bit.
    # Migrating to postgres should make this hack unnecessary.
    forms = list(forms) + [s.capitalize() for s in forms] 

    # Query database for set of matching forms
    queryset = Inflection.objects.annotate(formlower=Lower('form')).filter(formlower__in=forms)

    return queryset

def makelookup(forms=None):
    """
    Given a list of forms (assume lowercase), returns a normalized lookup table for forms, inflections, and lemmas.
    """
    table = {"forms": {}, "lemmas": {}, "lookup": {}}
    lemma_ids = set()

    queryet = get_inflections_queryset(forms)
    for inflection in queryset:
        table["lookup"].setdefault(inflection.form.lower(), []).append(inflection.id)
        table["forms"][inflection.id] = inflection.to_dict()
        lemma_ids.add(inflection.lemma_id)

    for lemma in Lemma.objects.filter(id__in=list(lemma_ids)):
        table["lemmas"][lemma.id] = lemma.to_dict()

    return table


def lemmatize(forms):
    """
    Lemmatizes multiple forms. 
    Returns a dictionary that maps each form to its lemmatization.
    """
    if isinstance(forms, str):
        forms = list(forms)
    queryset = get_inflections_queryset(forms)
    queryset = queryset.select_related('lemma').order_by('lemma__level', 'lemma__rank')
    data = {}
    for inflection in queryset:
        data.setdefault(inflection.form.lower(), []).append(inflection.lemmatize())
    return data
