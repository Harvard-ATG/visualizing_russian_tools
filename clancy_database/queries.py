from .models import Lemma


def lookup_lemma_by_word(word):
    results = []
    qs = Lemma.objects.filter(lemma=str(word))
    for lemma_object in qs:
        results.append(lemma_object.to_dict())
    return results


def lookup_lemma_by_id(lemma_id):
    results = []
    qs = Lemma.objects.filter(id=str(lemma_id))
    for lemma_object in qs:
        results.append(lemma_object.to_dict())
    return results
