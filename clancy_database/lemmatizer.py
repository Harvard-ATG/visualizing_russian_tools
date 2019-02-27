from .models import Inflection, Lemma


def makelookup(forms=None):
    """
    Given a list of forms, returns a lookup table using foreign keys to index into separate tables 
    containing details of forms and lemmas.
    """
    table = {"forms": {}, "lemmas": {}, "lookup": {}}
    lemma_ids = set()
    for inflection in Inflection.objects.filter(form__in=forms):
        table["lookup"].setdefault(inflection.form, []).append(inflection.id)
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
