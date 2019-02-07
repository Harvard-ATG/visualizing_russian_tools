from clancy_database.models import Inflection

def lemmatize(forms):
    qs = Inflection.objects.filter(form__in=forms).select_related('lemma').order_by('lemma__level', 'lemma__rank')
    lemmatized = {}
    for inflection in qs:
        details = inflection.lemma_dict()
        lemmatized.setdefault(inflection.form, []).append(details)

    # Ensure that cardinal numbers like 1,2,3... etc are assigned level 1E in the lemmatization.
    # Note: the client-side code strips punctuation from numbers so 2,8 => 28 or 2,4-1,9 => 2419
    # so no additional processing is necessary to handle those forms.
    for form in forms:
        if form in lemmatized:
            continue
        if form.isdigit():
            lemmatized[form] = [{
                "inflection": {
                    "type": "numeral",
                    "label": form,
                },
                "lemma": {
                    "level": "1E",
                    "rank": 0,
                    "pos": "num",
                }
            }]

    return lemmatized
