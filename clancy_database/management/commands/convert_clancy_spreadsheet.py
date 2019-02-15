from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import os
import os.path
import time

from clancy_database.spreadsheet import csv2db

class Command(BaseCommand):
    help = 'Converts spreadsheet into a SQLite database. Assumes that the spreadsheet is in CSV format (must be converted from XLSX first).'

    def add_arguments(self, parser):
        parser.add_argument("--csvfile", required=True, help="Input CSV file with russian spreadsheet data.", default="NewVisualizingRussian.csv")
        parser.add_argument("--dbfile", required=False, help="Output SQLite file created as a result of parsing the CSV.", default=settings.DATABASES['default']['NAME'])

    def handle(self, *args, **options):
        csvfile = options['csvfile']
        dbfile = options['dbfile']
        verbose = False
        
        if not os.path.exists(csvfile):
            raise CommandError("Input CSV file %s does not exist!" % csvfile)

        self.stdout.write("=> Processing...\n")
        start = time.time()
        csv2db.main(csvfile, dbfile, verbose=verbose)
        end = time.time()
        self.stdout.write("=> Completed. Execution time: %f seconds\n" % (end - start))
        self.stdout.write("=> Database saved to %s\n" % dbfile)