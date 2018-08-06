RUSSIAN_TABLES = ('lemma', 'inflection')

class RussianRouter(object): 
    def db_for_read(self, model, **hints):
        if model._meta.db_table in RUSSIAN_TABLES:
            return 'russian'
        return 'default'

    def db_for_write(self, model, **hints):
        if model._meta.db_table in RUSSIAN_TABLES:
            return 'russian'
        return 'default'
    
    def allow_relation(self, obj1, obj2, **hints):
        if obj1._meta.db_table in RUSSIAN_TABLES and obj2._meta.db_table in RUSSIAN_TABLES:
            return True
        return False
    
    def allow_syncdb(self, db, model):
        if db == 'russian':
            return False # we're not using syncdb 
        return True # but all other models/databases are fine
