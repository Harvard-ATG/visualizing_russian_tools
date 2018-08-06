from django.db import models

class Lemma(models.Model):
    id = models.IntegerField(primary_key=True, blank=False, null=False)
    external_id = models.IntegerField(unique=True, blank=True, null=True)
    lemma = models.TextField()
    stressed = models.TextField()
    translation = models.TextField()
    pos = models.TextField()
    pos_subtype = models.TextField()
    rank = models.IntegerField()
    count = models.FloatField(blank=True, null=True)
    level = models.TextField()
    gender = models.TextField()
    animacy = models.TextField()
    stem = models.TextField()
    ending = models.TextField()
    domain = models.TextField()
    aspect = models.TextField()
    aspect_counterpart = models.TextField()
    transitivity = models.TextField()

    def __str__(self):
        return "%s [%s:%s] " % (self.lemma, self.pos, self.id, )

    class Meta:
        managed = False
        db_table = 'lemma'
        indexes = [
            models.Index(fields=['lemma'], name='lemma_lemma_index'),
        ]

class Inflection(models.Model):
    id = models.IntegerField(primary_key=True, blank=False, null=False)
    lemma = models.ForeignKey('Lemma', on_delete=models.CASCADE)
    form = models.TextField()
    stressed = models.TextField()
    category = models.TextField()
    description = models.TextField()
    frequency = models.FloatField(blank=True, null=True)

    def __str__(self):
        return "%s [%s:%s]" % (self.form, self.category, self.id)

    class Meta:
        managed = False
        db_table = 'inflection'
        indexes = [
            models.Index(fields=['form'], name='inflection_form_index'),
        ]
