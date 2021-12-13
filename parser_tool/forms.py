from django import forms

CHOICES=[('Enable scores','enable'),
         ('Disable scores','disable')]
class wordForm(forms.Form):
    words = forms.CharField(widget=forms.Textarea, label='Enter each word on a new line')
    like = forms.ChoiceField(choices=CHOICES, widget=forms.RadioSelect, label='Score Keeper')