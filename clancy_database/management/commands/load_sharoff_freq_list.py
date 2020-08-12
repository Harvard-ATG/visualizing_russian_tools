from django.core.management.base import BaseCommand, CommandError
import argparse
import csv
import os
import sys

import clancy_database
from clancy_database.models import Inflection


class Command(BaseCommand):
    help = '''
Loads frequency list for russian by Serge Sharoff.

This command should only be run once the database has been populated
with the core set of lemmas and word forms, as it only updates
existing word forms.
'''

    def add_arguments(self, parser):
        default_tsv_file = os.path.join(os.path.dirname(clancy_database.__file__), "data", "sharoff_freq_list.tsv")
        parser.add_argument("--file", 
            required=False, 
            type=argparse.FileType("r"), 
            help="Input frequency list in TSV format with headers: Rank, Freq, WordForm", 
            default=default_tsv_file)

    def handle(self, *args, **options):
        self.load_data(tsv_file=options['file'], verbosity=options['verbosity'])

    def load_data(self, tsv_file, verbosity=0):
        total_records = 0
        total_updated = 0
        total_not_found =  0

        tsv_reader = lambda f: csv.DictReader(f, dialect=None, delimiter='\t', quoting=csv.QUOTE_NONE)
        for record in tsv_reader(tsv_file):
            rank, freq, word_form = record['Rank'], record['Freq'], record['WordForm']
            num_updated = Inflection.objects.filter(form=word_form).update(sharoff_freq=freq, sharoff_rank=rank)
            if num_updated == 0:
                total_not_found += 1 
            total_records += 1
            total_updated += num_updated

            if verbosity > 1:
                if num_updated == 0:
                    self.stderr.write(self.style.WARNING(f"Sharoff word form «{word_form}» not found in database"))
                else:
                    self.stdout.write(f"Sharoff word form «{word_form}» found in database. Updated {num_updated} objects with rank and frequency: {rank},{freq}")
        self.stdout.write(self.style.SUCCESS(f"Loaded {total_records - total_not_found} of {total_records} records from Sharoff Frequency List"))
