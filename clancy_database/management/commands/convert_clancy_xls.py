import csv
import os
import os.path
import time

from django.core.management.base import BaseCommand, CommandError
from openpyxl import load_workbook


class Command(BaseCommand):
    help = "Converts an XLS spreadsheet into a CSV format."

    def add_arguments(self, parser):
        parser.add_argument(
            "--xlsfile", required=True, help="Input XLS file with the russian spreadsheet data.", default="NewVisualizingRussian.xlsx"
        )
        parser.add_argument("--csvfile", required=False, help="Output CSV file.", default="russian.csv")
        parser.add_argument("--verbose", help="Increase output verbosity.", action="store_true")

    def handle(self, *args, **options):
        xlsfile = options["xlsfile"]
        csvfile = options["csvfile"]
        verbose = options["verbose"]

        if not os.path.exists(xlsfile):
            raise CommandError("Input XLS file %s does not exist!" % xlsfile)

        self.stdout.write("=> Reading excel file...\n")
        start = time.time()
        workbook = load_workbook(filename=xlsfile)
        worksheet = workbook.active

        with open(csvfile, "w", newline="") as f:
            csvwriter = csv.writer(f, quoting=csv.QUOTE_ALL)  # commas may appear inside fields
            for row in worksheet.values:
                csvwriter.writerow(row)

        end = time.time()
        self.stdout.write("=> Completed. Execution time: %f seconds\n" % (end - start))
        self.stdout.write("=> CSV file saved to %s\n" % csvfile)
