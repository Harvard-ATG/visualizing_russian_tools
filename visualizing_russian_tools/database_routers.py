import clancy_database

CLANCY_DATABASE_TABLES = clancy_database.TABLE_NAMES 

class DatabaseRouter(object): 
    def db_for_read(self, model, **hints):
        if model._meta.db_table in CLANCY_DATABASE_TABLES:
            return 'clancy_database'
        return 'default'

    def db_for_write(self, model, **hints):
        if model._meta.db_table in CLANCY_DATABASE_TABLES:
            return 'clancy_database'
        return 'default'
    
    def allow_relation(self, obj1, obj2, **hints):
        return True
    
    def allow_syncdb(self, db, model):
        if db == 'clancy_database':
            return False # we're not using syncdb 
        return True # but all other models/databases are fine
