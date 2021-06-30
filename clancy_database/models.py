from django.db import models
import operator

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
    rnc_doc_count = models.IntegerField()
    rnc_lemma_count = models.IntegerField()

    def __str__(self):
        return "%s [%s:%s] " % (self.lemma, self.pos, self.id)

    def get_aspect_pair(self):
        '''
        Returns a 2-element list containing the first matching aspect pair for this lemma, or an empty list
        if no aspect pairs were found with the lemma.

        Note that there can be multiple pairs for a given lemma. For example, lemma "играть" can mach the following
        aspect pairs:
            играть/сыграть
            играть/поиграть
            играть/заиграть

        In this case, the pairs are assigned an index according to how they appear in the source data (e.g. Steven's
        spreadsheet). We can use that ordering to select one.
        '''
        aspect_pairs_qs = AspectPair.objects.filter(lemma_id=self.id).order_by('pair_index').values('pair_id')
        try:
            pair = aspect_pairs_qs[0]
        except IndexError:
            return []

        aspect_pair_qs = AspectPair.objects.filter(pair_id=pair['pair_id'])
        if len(aspect_pair_qs) == 2:
            return [aspect_pair.to_dict() for aspect_pair in sorted(aspect_pair_qs, key=operator.attrgetter('aspect'))]
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
            "rnc_doc_count": self.rnc_doc_count,
            "rnc_lemma_count": self.rnc_lemma_count,
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
    pair_index = models.IntegerField()
    lemma = models.ForeignKey('Lemma', related_name='+', on_delete=models.CASCADE)
    lemma_label = models.TextField()
    lemma_count = models.FloatField(blank=True, null=True)
    aspect = models.TextField()

    def to_dict(self):
        data = {
            "id": self.id,
            "pair_id": self.pair_id,
            "pair_name": self.pair_name,
            "pair_index": self.pair_index,
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
    sharoff_freq = models.FloatField(blank=True, null=True)
    sharoff_rank = models.IntegerField()
    rnc_doc_count = models.IntegerField()
    rnc_form_count = models.IntegerField()

    def __str__(self):
        return "%s [%s:%s]" % (self.form, self.type, self.id)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "label": self.form,
            "stressed": self.stressed,
            "sharoff_freq": self.sharoff_freq,
            "sharoff_rank": self.sharoff_rank,
            "lemma_id": self.lemma_id,
            "rnc_doc_count": self.rnc_doc_count,
            "rnc_form_count": self.rnc_form_count,
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
