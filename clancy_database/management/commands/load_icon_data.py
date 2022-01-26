import csv
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import os.path
import clancy_database
from clancy_database.spreadsheet import insert_db_columns
import sqlite3
import time


class Command(BaseCommand):
    help = 'Load icons from icons.csv file'
    
    def add_arguments(self, parser):
        icon_file_csv = os.path.join(os.path.dirname(clancy_database.__file__), "data", "icons.csv")
        parser.add_argument("--csvfile", required=False, help="Input CSV file", default=icon_file_csv)
        parser.add_argument("--dbfile", required=False, help="Output SQLite file created as a result of parsing the CSV.", default=settings.DATABASES['clancy_database']['NAME'])

    def handle(self, *args, **options):
        db_file = options['dbfile']
        icon_file_csv = options['csvfile']
        CONN = sqlite3.connect(db_file)
        cursor = CONN.cursor()
        start = time.time()
        with open(icon_file_csv, encoding='utf-8-sig') as csvf:
            csvReader = csv.DictReader(csvf)
            for row in csvReader:
                sql_statement = '''UPDATE lemma SET icon_url=?, icon_license=?, icon_attribute=? WHERE lemma=?'''
                lemma = row["Russian"]
                icon_url = row["icon_url"]
                license =  row["license_description"]
                icon_attribute =  row["attribution"]
                values = [icon_url, license, icon_attribute, lemma]
                try:
                    cursor.execute(sql_statement, values)
                except sqlite3.Error as e:
                    print(e)
                    print(sql_statement, values)
                    raise e
        CONN.commit()
        end = time.time()
        self.stdout.write("=> Completed. Execution time: %f seconds\n" % (end - start))
        