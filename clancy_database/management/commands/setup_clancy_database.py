from django.core.management.base import BaseCommand
from django.conf import settings
import subprocess
import os
import os.path

import clancy_database

class Command(BaseCommand):
    help = 'Setup sqlite database from SQL fixture containing dictionary of russian word forms.'

    def handle(self, *args, **kwargs):
        app_dir = os.path.dirname(clancy_database.__file__)
        dbfile = settings.DATABASES['default']['NAME']
        sqlfile = os.path.join(app_dir, 'fixtures', 'russian.sql.gz')
        if os.path.exists(dbfile):
            os.remove(dbfile)
        cmd = "gunzip -c {sqlfile} | sqlite3 {dbfile}".format(sqlfile=sqlfile, dbfile=dbfile)
        subprocess.run(cmd, shell=True)
        self.stdout.write("Database file loaded: %s" % dbfile)