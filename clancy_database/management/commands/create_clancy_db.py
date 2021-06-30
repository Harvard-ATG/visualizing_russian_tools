from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import os
import os.path
import time
import logging

from clancy_database.spreadsheet import csv2db


class Command(BaseCommand):
    help = 'Creates a SQLite database from a CSV.'

    def add_arguments(self, parser):
        parser.add_argument("--csvfile", required=True, help="Input CSV file with russian spreadsheet data.", default="NewVisualizingRussian.csv")
        parser.add_argument("--dbfile", required=False, help="Output SQLite file created as a result of parsing the CSV.", default=settings.DATABASES['default']['NAME'])

    def handle(self, *args, **options):
        csvfile = options['csvfile']
        dbfile = options['dbfile']
        verbosity = int(options['verbosity'])

        if not os.path.exists(csvfile):
            raise CommandError("Input CSV file %s does not exist!" % csvfile)

        root_logger = logging.getLogger('')
        if verbosity == 0:
            root_logger.setLevel(logging.WARNING)
        elif verbosity == 1:
            root_logger.setLevel(logging.INFO)
        elif verbosity > 1:
            root_logger.setLevel(logging.DEBUG)

        self.stdout.write("=> Processing...\n")
        start = time.time()
        csv2db.main(csvfile, dbfile)
        end = time.time()
        self.stdout.write("=> Completed. Execution time: %f seconds\n" % (end - start))
        self.stdout.write("=> Database saved to %s\n" % dbfile)
