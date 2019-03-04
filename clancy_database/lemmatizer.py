from django.db.models.functions import Lower

from .models import Inflection, Lemma


def makelookup(forms=None):
    """
    Given a list of forms (assume lowercase), returns a normalized lookup table for forms, inflections, and lemmas.
    """
    table = {"forms": {}, "lemmas": {}, "lookup": {}}
    lemma_ids = set()

    # Ensure that we match capitalized forms in the DB for some entries (e.g. России).
    # Sqlite doesn't work well with the annotated filter, so using this to cheat a bit.
    # Migrating to postgres should make this hack unnecessary.
    forms = list(forms) + [s.capitalize() for s in forms] 

    # Query database for set of matching forms
    queryset = Inflection.objects.annotate(formlower=Lower('form')).filter(formlower__in=forms)

    for inflection in queryset:
        table["lookup"].setdefault(inflection.form.lower(), []).append(inflection.id)
        table["forms"][inflection.id] = inflection.to_dict()
        lemma_ids.add(inflection.lemma_id)

    for lemma in Lemma.objects.filter(id__in=list(lemma_ids)):
        table["lemmas"][lemma.id] = lemma.to_dict()

    return table


def lemmatize(forms=None):
    """
    Given a list of forms, returns a dictionary that maps a form directly linking to all possible lemmatized forms.
    """
    if forms is None:
        return []
    qs = Inflection.objects.filter(form__in=forms).select_related('lemma').order_by('lemma__level', 'lemma__rank')
    data = {}
    for inflection in qs:
        lemma_details = inflection.lemmatize()
        data.setdefault(inflection.form, []).append(lemma_details)
    return data
