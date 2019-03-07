from django.db import models

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
    aspect_counterpart = models.TextField()
    transitivity = models.TextField()
    rank = models.IntegerField()
    count = models.FloatField(blank=True, null=True)

    def __str__(self):
        return "%s [%s:%s] " % (self.lemma, self.pos, self.id, )
    
    def to_dict(self):
        data = {
            "id": self.id,
            "external_id": self.external_id,
            "label": self.lemma,
            "stressed": self.stressed,
            "translation": self.translation,
            "gender": self.gender,
            "pos": self.pos,
            "level": self.level,
            "count": self.count,
            "rank": self.rank,
            "animacy": self.animacy,
            "aspect": self.aspect,
            "aspect_counterpart": self.aspect_counterpart,
            "transitivity": self.transitivity,
            "reverse": "",
        }
        return data

    class Meta:
        managed = False
        db_table = 'lemma'
        indexes = [
            models.Index(fields=['lemma'], name='lemma_lemma_index'),
        ]
        ordering = ['level', 'rank'] # Order by hand-picked levels and then by more frequently occurring lemma

class Inflection(models.Model):
    id = models.IntegerField(primary_key=True, blank=False, null=False)
    lemma = models.ForeignKey('Lemma', on_delete=models.PROTECT)
    form = models.TextField()
    stressed = models.TextField()
    type = models.TextField()
    frequency = models.FloatField(blank=True, null=True)

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
