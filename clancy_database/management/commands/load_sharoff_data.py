import argparse
import csv
import os
import sqlite3

from django.conf import settings
from django.core.management.base import BaseCommand

import clancy_database


class Command(BaseCommand):
    help = """
Loads frequency list for russian by Serge Sharoff.

This command should only be run after the database has been populated
with the core set of lemmas and word forms.

It works by bulk inserting the sharoff words into a temporary table,
and then joining with the target table using an UPDATE/SELECT, which 
is more efficient than a series of UPDATE queries (e.g. UPDATE x WHERE y = ?).
"""

    def add_arguments(self, parser):
        default_tsv_file = os.path.join(os.path.dirname(clancy_database.__file__), "data", "sharoff_freq_list.tsv")
        parser.add_argument(
            "--file",
            required=False,
            type=argparse.FileType("r"),
            help="Input frequency list in TSV format with headers: Rank, Freq, WordForm",
            default=default_tsv_file,
        )
        parser.add_argument(
            "--dbfile", required=False, type=str, help="Sqlite database", default=settings.DATABASES["clancy_database"]["NAME"]
        )

    def handle(self, *args, **options):
        self.load_data(tsv_file=options["file"], dbfile=options["dbfile"], verbosity=options["verbosity"])

    def load_data(self, tsv_file, dbfile, verbosity=0):
        total_records = 0
        connection = sqlite3.connect(dbfile)
        self.cursor = connection.cursor()

        self.create_table()

        def tsv_reader(f):
            return csv.DictReader(f, dialect=None, delimiter="\t", quoting=csv.QUOTE_NONE)

        for record in tsv_reader(tsv_file):
            total_records += 1
            self.insert_form(record["WordForm"], record["Rank"], record["Freq"])
        self.join_records()
        self.delete_table()
        connection.commit()
        connection.close()
        self.stdout.write(self.style.SUCCESS(f"Loaded {total_records} records from Sharoff Frequency List"))

    def create_table(self):
        self.cursor.execute("CREATE TABLE IF NOT EXISTS sharoff_freq_list (form TEXT PRIMARY KEY, rank INTEGER, freq REAL)")
        self.cursor.execute("DELETE FROM sharoff_freq_list")

    def delete_table(self):
        self.cursor.execute("DROP TABLE sharoff_freq_list")

    def insert_form(self, form, rank, freq):
        sql = "INSERT INTO sharoff_freq_list (form, rank, freq) VALUES (?, ?, ?)"
        values = [form, rank, freq]
        self.cursor.execute(sql, values)

    def join_records(self):
        sql = """
UPDATE inflection SET 
    sharoff_freq = (select freq from sharoff_freq_list where sharoff_freq_list.form = inflection.form),
    sharoff_rank = (select rank from sharoff_freq_list where sharoff_freq_list.form = inflection.form)
"""
        self.cursor.execute(sql)
