from django.db import models
from django.db.models import Subquery


class Lemma(models.Model):
    id = models.IntegerField(primary_key=True, blank=False, null=False)
    external_id = models.IntegerField(unique=True, blank=True, null=True)
    lemma = models.TextField()
    stressed = models.TextField()
    translation = models.TextField()
    pos = models.TextField()
    pos_subtype = models.TextField()
    level = models.TextField()
    gender = models.TextField()
    animacy = models.TextField()
    stem = models.TextField()
    ending = models.TextField()
    domain = models.TextField()
    aspect = models.TextField()
    transitivity = models.TextField()
    stress_pattern_semu = models.TextField()
    rank = models.IntegerField()
    count = models.FloatField(blank=True, null=True)

    def __str__(self):
        return "%s [%s:%s] " % (self.lemma, self.pos, self.id)

    def get_aspect_pair(self):
        pair_id_subquery = AspectPair.objects.filter(lemma_id=self.id).values('pair_id')
        aspect_pair_qs = AspectPair.objects.filter(pair_id__in=Subquery(pair_id_subquery))
        if len(aspect_pair_qs) == 2:
            return [aspect_pair.to_dict() for aspect_pair in aspect_pair_qs]
        return []

    def to_dict(self):
        data = {
            "id": self.id,
            "label": self.lemma,
            "stressed": self.stressed,
            "translation": self.translation,
            "gender": self.gender,
            "pos": self.pos,
            "level": self.level,
            "level_num": int(self.level[0]),
            "count": self.count,
            "rank": self.rank,
            "animacy": self.animacy,
            "aspect": self.aspect,
            "aspect_pair": [],
            "transitivity": self.transitivity,
            "stress_pattern_semu": self.stress_pattern_semu,
            "reverse": "",
        }
        if self.pos == "verb":
            data["aspect_pair"] = self.get_aspect_pair()
        return data

    class Meta:
        managed = False
        db_table = 'lemma'
        indexes = [
            models.Index(fields=['lemma'], name='lemma_lemma_index'),
        ]
        ordering = ['level', 'rank'] # Order by hand-picked levels and then by more frequently occurring lemma


class AspectPair(models.Model):
    id = models.IntegerField(primary_key=True, blank=False, null=False)
    pair_id = models.IntegerField()
    pair_name = models.TextField()
    lemma = models.ForeignKey('Lemma', related_name='+', on_delete=models.CASCADE)
    lemma_label = models.TextField()
    lemma_count = models.FloatField(blank=True, null=True)
    aspect = models.TextField()

    def to_dict(self):
        data = {
            "id": self.id,
            "pair_id": self.pair_id,
            "pair_name": self.pair_name,
            "lemma_label": self.lemma_label,
            "lemma_id": self.lemma_id,
            "lemma_count": self.lemma_count,
            "aspect": self.aspect,
        }
        return data

    def __str__(self):
        return "%s:%s (%s)" % (self.lemma_label, self.pair_name, self.id)

    class Meta:
        managed = False
        db_table = 'aspect_pair'
        ordering = ['pair_id', 'aspect', 'lemma']


class Inflection(models.Model):
    id = models.IntegerField(primary_key=True, blank=False, null=False)
    lemma = models.ForeignKey('Lemma', on_delete=models.PROTECT)
    form = models.TextField()
    stressed = models.TextField()
    type = models.TextField()
    frequency = models.FloatField(blank=True, null=True)
    sharoff_freq = models.FloatField(blank=True, null=True)
    sharoff_rank = models.IntegerField()

    def __str__(self):
        return "%s [%s:%s]" % (self.form, self.type, self.id)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "label": self.form,
            "stressed": self.stressed,
            "frequency": self.frequency,
            "lemma_id": self.lemma_id,
        }

    def lemmatize(self):
        data = self.to_dict()
        data["lemma"] = self.lemma.to_dict()
        return data

    class Meta:
        managed = False
        db_table = 'inflection'
        indexes = [
            models.Index(fields=['form'], name='inflection_form_index'),
        ]
