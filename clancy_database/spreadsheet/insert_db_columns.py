from django.core.management.base import CommandError
import os
import os.path

FILE_DIR = os.path.dirname(os.path.realpath(__file__))

def main(self, sqlfile, cursor):
    sql_file_path =  os.path.exists(os.path.join(FILE_DIR, sqlfile))
    if not os.path.exists(sql_file_path):
        raise CommandError("Input SQL file %s does not exist!" % sqlfile)
    self.stdout.write(f"=> Reading sql file...\n")
    with open(os.path.join(FILE_DIR, sqlfile), 'r', encoding='utf-8') as f:
            schema = f.read()
            self.stdout.write(f"=> Executing the following sql commands...\n{schema}")
            try:
                cursor.executescript(schema)
                self.stdout.write(f"=> Successfully added columns...\n")
            except:
                self.stdout.write('=> Columns already exist...\n')
