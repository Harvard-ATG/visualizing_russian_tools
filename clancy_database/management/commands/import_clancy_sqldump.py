from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import subprocess
import os
import os.path

import clancy_database


class Command(BaseCommand):
    help = 'Import database from SQL dump file.'

    def add_arguments(self, parser):
        default_sql_file = os.path.join(os.path.dirname(clancy_database.__file__), "data", "russian.sql.gz")
        parser.add_argument("--sqlfile", required=False, help="Input SQL file.", default=default_sql_file)
        parser.add_argument("--dbfile", required=False, help="Database to load", default=settings.DATABASES['default']['NAME'])

    def handle(self, *args, **options):
        dbfile = options['dbfile']
        sqlfile = options['sqlfile']

        if sqlfile.endswith(".sql.gz"):
            cmd = "gunzip -c {sqlfile} | sqlite3 {dbfile}".format(sqlfile=sqlfile, dbfile=dbfile)
        elif sqlfile.endswith(".sql"):
            cmd = "cat {sqlfile} | sqlite3 {dbfile}".format(sqlfile=sqlfile, dbfile=dbfile)
        else:
            raise CommandError("Unrecognized SQL file %s - should end with .sql or .sql.gz" % sqlfile)

        subprocess.run(cmd, shell=True)
        self.stdout.write("Database loaded: %s" % dbfile)
