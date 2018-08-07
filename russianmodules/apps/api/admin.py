from django.contrib import admin
from .models import Lemma, Inflection, Animacy, Aspect, Transitivity, Pos, Level, InflectionType

class InflectionInline(admin.TabularInline):
    model = Inflection

@admin.register(Inflection)
class InflectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'form', 'type')
    list_filter = ('type',)
    autocomplete_fields = ('lemma', 'type')
    search_fields = ['form', 'type']

@admin.register(Lemma)
class LemmaAdmin(admin.ModelAdmin):
    list_display = ('id', 'external_id', 'lemma', 'translation', 'pos', 'pos_subtype', 'gender', 'animacy', 'count','level', 'rank', 'aspect', 'transitivity')
    list_filter = ('level', 'pos', 'pos_subtype', 'gender', 'animacy', 'aspect', 'transitivity')
    search_fields = ['id', 'lemma', 'translation']
    ordering = ['-count', 'level']
    inlines = [InflectionInline, ]

@admin.register(InflectionType)
class InflectionType(admin.ModelAdmin):
    list_display = ('key', 'description')
    search_fields = ['key']
    ordering = ['key']

@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ('key', 'description')
    ordering = ['key']

@admin.register(Pos)
class PosAdmin(admin.ModelAdmin):
    list_display = ('key', 'description')
    ordering = ['key']

@admin.register(Transitivity)
class TransitivityAdmin(admin.ModelAdmin):
    list_display = ('key', 'description')
    ordering = ['key']

@admin.register(Aspect)
class AspectAdmin(admin.ModelAdmin):
    list_display = ('key', 'description')
    ordering = ['key']

@admin.register(Animacy)
class AnimacyAdmin(admin.ModelAdmin):
    list_display = ('key', 'description')
    ordering = ['key']
