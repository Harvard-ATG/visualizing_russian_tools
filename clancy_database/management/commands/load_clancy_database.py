from django.core.management.base import BaseCommand
from django.utils import timezone
import subprocess
import os
import os.path

import clancy_database

class Command(BaseCommand):
    help = 'Creates sqlite database from SQL fixture containing lemma and inflection data.'

    def handle(self, *args, **kwargs):
        app_dir = os.path.dirname(clancy_database.__file__)
        dbfile = os.path.join(app_dir, 'russian.sqlite3')
        sqlfile = os.path.join(app_dir, 'fixtures', 'russian.sql.gz')
        if os.path.exists(dbfile):
            os.remove(dbfile)
        cmd = "/usr/bin/gunzip -c {sqlfile} | /usr/bin/sqlite3 {dbfile}".format(sqlfile=sqlfile, dbfile=dbfile)
        subprocess.run(cmd, shell=True)
        self.stdout.write("Database file loaded: %s" % dbfile)