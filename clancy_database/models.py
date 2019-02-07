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

    def lemma_dict(self):
        result = {
            "inflection": {
                "type": self.type,
                "label": self.form,
                "stressed": self.stressed,
            },
            "lemma": {
                "stressed": self.lemma.stressed,
                "gender": self.lemma.gender,
                "pos": self.lemma.pos,
                "level": self.lemma.level,
                "count": self.lemma.count,
                "rank": self.lemma.rank,
                "animacy": self.lemma.animacy,
                "label": self.lemma.lemma,
                "id": self.lemma.external_id,
                "reverse": "",
            }
        }
        return result

    class Meta:
        managed = False
        db_table = 'inflection'
        indexes = [
            models.Index(fields=['form'], name='inflection_form_index'),
        ]
