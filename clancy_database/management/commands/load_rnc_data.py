import argparse
import csv
import os
import sqlite3

from django.conf import settings
from django.core.management.base import BaseCommand

import clancy_database


class Command(BaseCommand):
    help = """
Loads frequency lists obtained from searching the RNC (https://ruscorpora.ru/).

This command should only be run after the database has been populated
with the core set of lemmas and word forms.

There are two frequency lists loaded by this command:
    - rnc_form_freq_list.tsv: number of documents in which the specific form (e.g. "человек") appears, and the 
        total number of occurrences of that specific form.
    - rnc_lemma_freq_list.tsv: number of documents in which the lemma (e.g. "человек") appears, and the total number of
      occurrences of the lemma. That means it will ALSO count человек,люди,людей,людям, etc...

It works by bulk inserting the RNC data into a temporary table, and then copying the data to the target table
using an UPDATE/SELECT. This is more efficient than submitting a series of UPDATE queries (e.g. UPDATE x WHERE y = ?).
"""

    def add_arguments(self, parser):
        rnc_form_tsv_file = os.path.join(os.path.dirname(clancy_database.__file__), "data", "rnc_form_freq_list.tsv")
        rnc_lemma_tsv_file = os.path.join(os.path.dirname(clancy_database.__file__), "data", "rnc_lemma_freq_list.tsv")
        parser.add_argument(
            "--formfile",
            required=False,
            type=argparse.FileType("r"),
            help="Input frequency list in TSV format with headers: form,docs,occurrences",
            default=rnc_form_tsv_file,
        )
        parser.add_argument(
            "--lemmafile",
            required=False,
            type=argparse.FileType("r"),
            help="Input frequency list in TSV format with headers: lemma,docs,occurrences",
            default=rnc_lemma_tsv_file,
        )
        parser.add_argument(
            "--dbfile", required=False, type=str, help="Sqlite database", default=settings.DATABASES["clancy_database"]["NAME"]
        )

    def handle(self, *args, **options):
        connection = sqlite3.connect(options["dbfile"])
        self.cursor = connection.cursor()
        self.load_data(
            formfile=options["formfile"],
            lemmafile=options["lemmafile"],
            verbosity=options["verbosity"],
        )
        self.cursor = None
        connection.commit()
        connection.close()

    def load_data(self, formfile, lemmafile, verbosity=0):
        def tsv_reader(f):
            return csv.DictReader(f, dialect=None, delimiter="\t", quoting=csv.QUOTE_NONE)
            
        self.create_load_table()

        self.stdout.write(f"Loading: {formfile.name}")
        total_records = 0
        for record in tsv_reader(formfile):
            total_records += 1
            self.insert_load_record(label=record["form"], docs=record["docs"], occurrences=record["occurrences"])
        self.update_inflection_records()
        self.stdout.write(f"Loaded {total_records} forms from RNC frequency data")
        self.clear_load_table()

        self.stdout.write(f"Loading: {lemmafile.name}")
        total_records = 0
        for record in tsv_reader(lemmafile):
            total_records += 1
            self.insert_load_record(label=record["lemma"], docs=record["docs"], occurrences=record["occurrences"])
        self.update_lemma_records()
        self.stdout.write(f"Loaded {total_records} lemmas from RNC frequency data")

        self.after_load_stats()
        self.delete_load_table()

    def create_load_table(self):
        self.cursor.execute("CREATE TABLE IF NOT EXISTS rnc_data (label TEXT PRIMARY KEY, docs INTEGER, occurrences INTEGER)")
        self.cursor.execute("DELETE FROM rnc_data")

    def clear_load_table(self):
        self.cursor.execute("DELETE FROM rnc_data")

    def delete_load_table(self):
        self.cursor.execute("DROP TABLE rnc_data")

    def insert_load_record(self, label, docs, occurrences):
        sql = "INSERT INTO rnc_data (label, docs, occurrences) VALUES (?, ?, ?)"
        values = [label, docs, occurrences]
        try:
            self.cursor.execute(sql, values)
        except sqlite3.Error as e:
            print(e)
            print(sql, values)
            raise e

    def update_inflection_records(self):
        sql = """
UPDATE inflection SET 
    rnc_doc_count = (select docs from rnc_data where rnc_data.label = inflection.form),
    rnc_form_count = (select occurrences from rnc_data where rnc_data.label = inflection.form)
"""
        self.cursor.execute(sql)

    def update_lemma_records(self):
        sql = """
UPDATE lemma SET 
    rnc_doc_count = (select docs from rnc_data where rnc_data.label = lemma.lemma),
    rnc_lemma_count = (select occurrences from rnc_data where rnc_data.label = lemma.lemma)
"""
        self.cursor.execute(sql)

    def after_load_stats(self):
        stats_for = {
            "total_lemmas": {"sql": "SELECT count(1) FROM lemma", "result": None},
            "missing_lemmas": {"sql": "SELECT count(1) FROM lemma WHERE coalesce(rnc_lemma_count, '') == ''", "result": None},
            "total_forms": {"sql": "SELECT count(1) FROM inflection", "result": None},
            "missing_forms": {"sql": "SELECT count(1) FROM inflection WHERE coalesce(rnc_form_count, '') == ''", "result": None},
        }
        for key in stats_for:
            self.cursor.execute(stats_for[key]["sql"])
            result = self.cursor.fetchone()
            stats_for[key]["result"] = result[0]

        total_lemmas = stats_for["total_lemmas"]["result"]
        missing_lemmas = stats_for["missing_lemmas"]["result"]
        found_lemmas = total_lemmas - missing_lemmas
        self.stdout.write(
            "Lemma RNC counts: {percent_lemmas:.0%} ({found_lemmas}/{total_lemmas})".format(
                percent_lemmas=found_lemmas / total_lemmas,
                found_lemmas=found_lemmas,
                total_lemmas=total_lemmas,
            )
        )

        total_forms = stats_for["total_forms"]["result"]
        missing_forms = stats_for["missing_forms"]["result"]
        found_forms = total_forms - missing_forms
        self.stdout.write(
            "Form RNC counts: {percent_forms:.0%} ({found_forms}/{total_forms})".format(
                percent_forms=found_forms / total_forms,
                found_forms=found_forms,
                total_forms=total_forms,
            )
        )
