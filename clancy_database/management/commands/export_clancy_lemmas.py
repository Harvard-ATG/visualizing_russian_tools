import csv
import sys

from django.core.management.base import BaseCommand
from django.db.models import Q

from clancy_database.models import Lemma


class Command(BaseCommand):
    help = "Exports a list of lemmas from the database to standard output."

    def add_arguments(self, parser):
        parser.add_argument("--format", help="CSV or TSV format", choices=("tsv", "csv"), default="tsv")
        parser.add_argument("--level", help="Filter by level")
        parser.add_argument("--pos", help="Filter by part of speech")
        parser.add_argument("--exclude-mwes", help="Exclude multiple word expressions", action="store_true", default=False)
        parser.add_argument("--fields", help="List of fields to return", default="label,translation")

    def handle(self, *args, **options):
        queryset = self.build_queryset(
            level=options["level"],
            pos=options["pos"],
            exclude_mwes=options["exclude_mwes"],
        )
        self.export_lemmas(queryset, fields=options["fields"].split(","), format=options["format"])

    def build_queryset(self, level=None, pos=None, exclude_mwes=False):
        queryset = Lemma.objects.all()
        if level is not None:
            queryset = queryset.filter(level=level)
        if pos is not None:
            queryset = queryset.filter(pos=pos)
        if exclude_mwes:
            queryset = queryset.filter(~Q(lemma__contains=" "))
        return queryset

    def export_lemmas(self, queryset, fields=None, format=None):
        delimiter = "\t" if format == "tsv" else ","
        writer = csv.writer(sys.stdout, delimiter=delimiter, quoting=csv.QUOTE_MINIMAL)
        for lemma in queryset:
            data = lemma.to_dict()
            row = [data[f] for f in fields]
            writer.writerow(row)
