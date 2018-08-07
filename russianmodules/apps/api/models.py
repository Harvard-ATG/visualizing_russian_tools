from django.db import models


class Animacy(models.Model):
    key = models.TextField(primary_key=True, blank=True, null=False)
    description = models.TextField()

    def __str__(self):
        return self.key

    class Meta:
        managed = False
        db_table = 'animacy'
        verbose_name_plural = 'animacy'


class Aspect(models.Model):
    key = models.TextField(primary_key=True, blank=True, null=False)
    description = models.TextField()

    def __str__(self):
        return self.key

    class Meta:
        managed = False
        db_table = 'aspect'
        verbose_name_plural = 'aspects'


class Gender(models.Model):
    key = models.TextField(primary_key=True, blank=True, null=False)
    description = models.TextField()

    def __str__(self):
        return self.key

    class Meta:
        managed = False
        db_table = 'gender'
        verbose_name_plural = 'genders'


class InflectionType(models.Model):
    key = models.TextField(primary_key=True, blank=True, null=False)
    description = models.TextField()

    def __str__(self):
        return self.key

    class Meta:
        managed = False
        db_table = 'inflection_type'
        verbose_name_plural = 'inflection_types'

class Level(models.Model):
    key = models.TextField(primary_key=True, blank=True, null=False)
    description = models.TextField()

    def __str__(self):
        return self.key

    class Meta:
        managed = False
        db_table = 'level'
        verbose_name_plural = 'levels'


class Pos(models.Model):
    key = models.TextField(primary_key=True, blank=True, null=False)
    description = models.TextField()

    def __str__(self):
        return self.key

    class Meta:
        managed = False
        db_table = 'pos'
        verbose_name_plural = 'pos'


class Transitivity(models.Model):
    key = models.TextField(primary_key=True, blank=True, null=False)
    description = models.TextField()

    def __str__(self):
        return self.key

    class Meta:
        managed = False
        db_table = 'transitivity'
        verbose_name_plural = 'transitivity'

class Lemma(models.Model):
    id = models.IntegerField(primary_key=True, blank=False, null=False)
    external_id = models.IntegerField(unique=True, blank=True, null=True)
    lemma = models.TextField()
    stressed = models.TextField()
    translation = models.TextField()
    pos = models.ForeignKey('Pos', on_delete=models.PROTECT, db_column='pos')
    pos_subtype = models.TextField()
    level = models.ForeignKey('Level', on_delete=models.PROTECT, db_column='level')
    gender = models.ForeignKey(Gender, on_delete=models.PROTECT, db_column='gender')
    animacy = models.ForeignKey(Animacy, on_delete=models.PROTECT, db_column='animacy')
    stem = models.TextField()
    ending = models.TextField()
    domain = models.TextField()
    aspect = models.TextField()
    aspect_counterpart = models.TextField()
    transitivity = models.ForeignKey('Transitivity', on_delete=models.PROTECT, db_column='transitivity')
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

class Inflection(models.Model):
    id = models.IntegerField(primary_key=True, blank=False, null=False)
    lemma = models.ForeignKey('Lemma', on_delete=models.PROTECT)
    form = models.TextField()
    stressed = models.TextField()
    type = models.ForeignKey('InflectionType', on_delete=models.PROTECT, db_column='type')
    frequency = models.FloatField(blank=True, null=True)

    def __str__(self):
        return "%s [%s:%s]" % (self.form, self.type, self.id)

    class Meta:
        managed = False
        db_table = 'inflection'
        indexes = [
            models.Index(fields=['form'], name='inflection_form_index'),
        ]