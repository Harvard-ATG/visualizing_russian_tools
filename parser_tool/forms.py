import logging

from django import forms
from django.core.exceptions import ValidationError

from clancy_database.models import Lemma

logger = logging.getLogger(__name__)

# CHOICES=[('Enable scores','enable'),
#          ('Disable scores','disable')]
# MAX_WORDS = [('3', 3), ('7', 7), ('13', 13), ('31', 31), ('57', 57)]


class WordListField(forms.Field):
    default_error_messages = {
        "invalid": "The number of words must be at least {min_words} (it has {actual_words}). {not_found_words}",
    }

    def __init__(self, *, min_words=57, **kwargs):
        """Override constructor to configure the minimum number of words required."""
        self.min_words = min_words
        super().__init__(**kwargs)

    def to_python(self, value):
        """Normalize data to a list of strings."""
        if not value:
            return []

        return [s.strip() for s in value.split("\n") if s != ""]

    def validate(self, value):
        """Check if value contains MIN words."""
        super().validate(value)
        # Check if words in the database
        value = [w for w in value if w != ""]
        qs_lemmas = Lemma.objects.filter(lemma__in=value).distinct().values_list("lemma", flat=True)
        logger.info(f"WordListField validate: {qs_lemmas} length={len(qs_lemmas)}")
        actual_words = len(qs_lemmas)
        if actual_words < self.min_words:
            not_found_words = list(set(qs_lemmas).symmetric_difference(set(value)))
            invalid_message = self.error_messages["invalid"].format(
                min_words=self.min_words,
                actual_words=actual_words,
                not_found_words="Not Found Words: " + ", ".join(not_found_words) if not_found_words else "",
            )
            raise ValidationError(invalid_message, code="invalid")


class WordListForm(forms.Form):
    words = WordListField(widget=forms.Textarea, label="Enter each word on a new line (minimum 57 words)")
    # number_of_words = forms.CharField(label='How many words would you like to use?', widget=forms.Select(choices=MAX_WORDS))
    # radio = forms.ChoiceField(choices=CHOICES, widget=forms.RadioSelect, label='Score Keeper')
