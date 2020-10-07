from django.core.management.base import BaseCommand, CommandError
import argparse
import csv
import os
import sys

import clancy_database
from clancy_database.models import Inflection


class Command(BaseCommand):
    help = '''
Loads inflection frequencies queried from the RNC.

This command should only be run once the database has been populated
with the core set of lemmas and word forms, as it only updates
existing word forms.
'''

    def add_arguments(self, parser):
        # change csv file
        default_csv_file = os.path.join(os.path.dirname(clancy_database.__file__), "data", "demo_with_split_csv.csv")
        parser.add_argument("--file", 
            required=False, 
            type=argparse.FileType("r"), 
            help="Input frequency list in CSV format with headers: form, docs, occurrences", 
            default=default_csv_file)

    def handle(self, *args, **options):
        self.load_data(csv_file=options['file'], verbosity=options['verbosity'])

    def load_data(self, csv_file, verbosity=0):
        total_records = 0
        total_updated = 0
        total_not_found =  0

        csv_reader = lambda f: csv.DictReader(f, dialect=None, quoting=csv.QUOTE_NONE)
        for record in csv_reader(csv_file):
            word_form, docs, occurrences = record['form'], record['docs'], record['occurrences']
            if docs != '' and occurrences != '':
                num_updated = Inflection.objects.filter(form=word_form).update(rnc_doc_count=docs, rnc_form_count=occurrences)
                if num_updated == 0:
                    total_not_found += 1 
                total_records += 1
                total_updated += num_updated

            if verbosity > 1:
                if num_updated == 0:
                    self.stderr.write(self.style.WARNING(f"RNC inflection «{word_form}» not found in database"))
                else:
                    self.stdout.write(f"RNC inflection «{word_form}» found in database. Updated {num_updated} objects with doc and word freqquency: {docs},{occurrences}")
        self.stdout.write(self.style.SUCCESS(f"Loaded {total_records - total_not_found} of {total_records} records from RNC frequency list"))
