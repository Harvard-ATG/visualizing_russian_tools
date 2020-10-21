from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import argparse
import csv
import os
import sys
import sqlite3

import clancy_database


class Command(BaseCommand):
    help = '''
Loads frequency list of word forms obtained from the RNC.

This command should only be run after the database has been populated
with the core set of lemmas and word forms.

It works by bulk inserting the RNC data into a temporary table,
and then joining with the target table using an UPDATE/SELECT, which 
is more efficient than a series of UPDATE queries (e.g. UPDATE x WHERE y = ?).
'''

    def add_arguments(self, parser):
        default_tsv_file = os.path.join(os.path.dirname(clancy_database.__file__), "data", "rnc_freq_list.tsv")
        parser.add_argument("--file", 
            required=False, 
            type=argparse.FileType("r"), 
            help="Input frequency list in TSV format with headers: Rank, Freq, WordForm", 
            default=default_tsv_file)
        parser.add_argument("--dbfile", 
            required=False, 
            type=str,
            help="Sqlite database", 
            default=settings.DATABASES['clancy_database']['NAME'])

    def handle(self, *args, **options):
        self.load_data(tsv_file=options['file'], dbfile=options['dbfile'], verbosity=options['verbosity'])

    def load_data(self, tsv_file, dbfile, verbosity=0):
        total_records = 0
        connection = sqlite3.connect(dbfile)
        self.cursor = connection.cursor()

        self.create_table()
        tsv_reader = lambda f: csv.DictReader(f, dialect=None, delimiter='\t', quoting=csv.QUOTE_NONE)
        for record in tsv_reader(tsv_file):
            total_records += 1
            self.insert_form(record['form'], record['docs'], record['occurrences'])
        self.join_records()
        self.delete_table()
        connection.commit()
        connection.close()
        self.stdout.write(self.style.SUCCESS(f"Loaded {total_records} records from RNC frequency data"))

    def create_table(self):
        self.cursor.execute("CREATE TABLE IF NOT EXISTS rnc_freq_list (form TEXT PRIMARY KEY, rnc_doc_count INTEGER, rnc_form_count INTEGER)")
        self.cursor.execute("DELETE FROM rnc_freq_list")

    def delete_table(self):
        self.cursor.execute("DROP TABLE rnc_freq_list")

    def insert_form(self, form, docs, occurrences):
        sql = "INSERT INTO rnc_freq_list (form, rnc_doc_count, rnc_form_count) VALUES (?, ?, ?)"
        values = [form, docs, occurrences]
        try:
            self.cursor.execute(sql, values)
        except sqlite3.Error as e:
            print(e)
            print(sql, values)
            raise e
    
    def join_records(self):
        sql = """
UPDATE inflection SET 
    rnc_doc_count = (select rnc_doc_count from rnc_freq_list where rnc_freq_list.form = inflection.form),
    rnc_form_count = (select rnc_form_count from rnc_freq_list where rnc_freq_list.form = inflection.form)
"""
        self.cursor.execute(sql)
