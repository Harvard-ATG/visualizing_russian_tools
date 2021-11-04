import csv
import sqlite3
import os.path
import re
import sys
import time
import logging
import unicodedata


FILE_DIR = os.path.dirname(os.path.realpath(__file__))

# List of CSV columns or field names that will be parsed
CSV_FIELD_NAMES = ['UniqueId', 'Russian', 'SecondRussian', 'POS', 'POS_Subtype', 'Animacy', 'Level', 'English', 'Rank', 'Count', 'Chapter', 'AdjAdvProp', 'Collocations', 'Domain', 'DomainTags', 'Strеssеd_Russiаn', 'Transliteration', 'Prefixes', 'Roots', 'Suffixes', 'Length', 'Classes', 'Location_Type', 'Notes', 'Notes_declension', 'Notes_conjugation', 'Inflected', 'Indeclinable', 'Stem', 'Hard_Soft', 'Word_Type', 'Stress_Pattern_SEMU', 'Inflected_Forms', 'Inflected_Stressed_Forms', 'Constructicon', 'Reverse_inflection', 'myKnown', 'myNew', 'myTarget', 'Drawing_Image', 'Photo_Image', 'Related_Words', 'Synonyms', 'Antonyms', 'Hyponyms', 'Co.Hyponyms', 'Hyperonyms', 'Example1', 'Example2', 'Example3', 'Gender_Counterparts', 'NOMsg_stressed', 'ACCsg_stressed', 'GENsg_stressed', 'LOCsg_stressed', 'DATsg_stressed', 'INSTsg_stressed', 'INSTaltsg_stressed', 'NOMpl_stressed', 'ACCpl_stressed', 'GENpl_stressed', 'LOCpl_stressed', 'DATpl_stressed', 'INSTpl_stressed', 'GEN2sg_stressed', 'LOC2sg_stressed', 'VOCsg_stressed', 'GEN3sg_stressed', 'Gender', 'Details', 'Declension', 'NOMsg', 'ACCsg', 'GENsg', 'LOCsg', 'DATsg', 'INSTsg', 'INSTaltsg', 'NOMpl', 'ACCpl', 'GENpl', 'LOCpl', 'DATpl', 'INSTpl', 'GEN2sg', 'LOC2sg', 'VOCsg', 'GEN3sg', 'Freq_NOMsg', 'Freq_ACCsg', 'Freq_GENsg', 'Freq_LOCsg', 'Freq_DATsg', 'Freq_INSTsg', 'Freq_INSTaltsg', 'Freq_NOMpl', 'Freq_ACCpl', 'Freq_GENpl', 'Freq_LOCpl', 'Freq_DATpl', 'Freq_INSTpl', 'Freq_GEN2sg', 'Freq_LOC2sg', 'Freq_VOCsg', 'Freq_GEN3sg', 'Infinitive_stressed', 'sg1_stressed', 'sg2_stressed', 'sg3_stressed', 'pl1_stressed', 'pl2_stressed', 'pl3_stressed', 'Mpast_stressed', 'Fpast_stressed', 'Npast_stressed', 'Ppast_stressed', 'Imper_sg_stressed', 'Imper_pl_stressed', 'future_stressed', 'PrAP_stressed', 'PrAP_forms_stressed', 'PAP_stressed', 'PAP_forms_stressed', 'PrPP_stressed', 'PrPP_forms_stressed', 'PPP_stressed', 'PPP_forms_stressed', 'VbAdv1_stressed', 'VbAdv2_stressed', 'Aspect', 'Transitivity', 'Impersonal', 'Reflexive', 'Verb_Details', 'Aspectual_Grouping', 'Aspectual_Counterpart', 'Infinitive', 'sg1', 'sg2', 'sg3', 'pl1', 'pl2', 'pl3', 'Mpast', 'Fpast', 'Npast', 'Ppast', 'Imper_sg', 'Imper_pl', 'future', 'PrAP', 'PrAP_forms', 'PAP', 'PAP_forms', 'PrPP', 'PrPP_forms', 'PPP', 'PPP_forms', 'VbAdv1', 'VbAdv2', 'Freq_Infinitive', 'Freq_sg1', 'Freq_sg2', 'Freq_sg3', 'Freq_pl1', 'Freq_pl2', 'Freq_pl3', 'Freq_Mpast', 'Freq_Fpast', 'Freq_Npast', 'Freq_Ppast', 'Freq_Imper_sg', 'Freq_Imper_pl', 'Freq_PrAP', 'Freq_PAP', 'Freq_PrPP', 'Freq_PPP', 'Freq_VbAdv1', 'Freq_VbAdv2', 'Lemma_Total', 'Forms_Total', 'Prop_Infinitive', 'Prop_sg1', 'Prop_sg2', 'Prop_sg3', 'Prop_pl1', 'Prop_pl2', 'Prop_pl3', 'Prop_Mpast', 'Prop_Fpast', 'Prop_Npast', 'Prop_Ppast', 'Prop_Imper_sg', 'Prop_Imper_pl', 'Prop_PrAP', 'Prop_PAP', 'Prop_PrPP', 'Prop_PPP', 'Prop_VbAdv1', 'Prop_VbAdv2', 'Prop_Check', 'mNOMsg_stressed', 'mACCsgAN_stressed', 'mACCsgIN_stressed', 'mGENsg_stressed', 'mLOCsg_stressed', 'mDATsg_stressed', 'mINSTsg_stressed', 'nNOMsg_stressed', 'nACCsg_stressed', 'nGENsg_stressed', 'nLOCsg_stressed', 'nDATsg_stressed', 'nINSTsg_stressed', 'fNOMsg_stressed', 'fACCsg_stressed', 'fGENsg_stressed', 'fLOCsg_stressed', 'fDATsg_stressed', 'fINSTsg_stressed', 'fINSTaltsg_stressed', 'plNOMpl_stressed', 'plACCplAN_stressed', 'plACCplIN_stressed', 'plGENpl_stressed', 'plLOCpl_stressed', 'plDATpl_stressed', 'plINSTpl_stressed', 'mshort_stressed', 'nshort_stressed', 'fshort_stressed', 'plshort_stressed', 'comparative_stressed', 'extracomparatives_stressed', 'stem', 'ending', 'mNOMsg', 'mACCsgAN', 'mACCsgIN', 'mGENsg', 'mLOCsg', 'mDATsg', 'mINSTsg', 'nNOMsg', 'nACCsg', 'nGENsg', 'nLOCsg', 'nDATsg', 'nINSTsg', 'fNOMsg', 'fACCsg', 'fGENsg', 'fLOCsg', 'fDATsg', 'fINSTsg', 'fINSTaltsg', 'plNOMpl', 'plACCplAN', 'plACCplIN', 'plGENpl', 'plLOCpl', 'plDATpl', 'plINSTpl', 'mshort', 'nshort', 'fshort', 'plshort', 'comparative', 'extracomparatives', 'mNOMsgFreq', 'mACCsgANFreq', 'mACCsgINFreq', 'mGENsgFreq', 'mLOCsgFreq', 'mDATsgFreq', 'mINSTsgFreq', 'nNOMsgFreq', 'nACCsgFreq', 'nGENsgFreq', 'nLOCsgFreq', 'nDATsgFreq', 'nINSTsgFreq', 'fNOMsgFreq', 'fACCsgFreq', 'fGENsgFreq', 'fLOCsgFreq', 'fDATsgFreq', 'fINSTsgFreq', 'fINSTaltsgFreq', 'plNOMplFreq', 'plACCplANFreq', 'plACCplINFreq', 'plGENplFreq', 'plLOCplFreq', 'plDATplFreq', 'plINSTplFreq', 'mshortFreq', 'nshortFreq', 'fshortFreq', 'plshortFreq', 'comparativeFreq', 'extracomparativesFreq', 'FinalColumn']

# Fields may contain commas to separate multiple forms.
# For example, the "SecondRussian" field may contain three forms: "о, об, обо".
# This defines a symbol that we can use to locate all instances where this is significant.
COMMA = ','

# These values will be considered "empty" or "missing" if they occur in a cell.
EMPTY_VALS = ('', '0', 'NA', '-', '—')

POS = {
    'inflected': {
        'adj': 'adjective',
        'adjpron': 'adjective pronoun',
        'noun': 'noun',
        'num': 'numeral',
        'pron': 'pronoun',
        'ord': 'ordinal',
    },
    'noninflected': {
        'adv': 'adverb',
        'adjadv': 'adjectival adverb',
        'conj': 'conjunction',
        'disc': 'discourse',
        'func': 'function',
        'misc': 'miscellaneous',
        'phrase': 'phrase',
        'prefix': 'prefix',
        'prep': 'preposition',
    },
}

DECLENSIONS = [
    # Singular.
    ('NOMsg', 'NOMsg'),
    ('ACCsg', 'ACCsg'),
    ('GENsg', 'GENsg'),
    ('GEN2sg', 'GEN2sg'),
    ('GEN3sg', 'GEN3sg'),
    ('LOCsg', 'LOCsg'),
    ('LOC2sg', 'LOC2sg'),
    ('DATsg', 'DATsg'),
    ('INSTsg', 'INSTsg'),
    ('INSTaltsg', 'INSTaltsg'),
    ('VOCsg', 'VOCsg'),

    # Plural for nouns, pronouns, etc.
    ('NOMpl', 'NOMpl'),
    ('ACCpl', 'ACCpl'),
    ('GENpl', 'GENpl'),
    ('LOCpl', 'LOCpl'),
    ('DATpl', 'DATpl'),
    ('INSTpl', 'INSTpl'),

    # Plural of adjectives.
    ('plNOMpl', 'plNOMpl'),
    ('plACCplAN', 'plACCplAN'),
    ('plACCplIN', 'plACCplIN'),
    ('plGENpl', 'plGENpl'),
    ('plLOCpl', 'plLOCpl'),
    ('plDATpl', 'plDATpl'),
    ('plINSTpl', 'plINSTpl'),

    # Masculine forms.
    ('mNOMsg', 'mNOMsg'),
    ('mACCsgAN', 'mACCsgAN'),
    ('mACCsgIN', 'mACCsgIN'),
    ('mGENsg', 'mGENsg'),
    ('mLOCsg', 'mLOCsg'),
    ('mDATsg', 'mDATsg'),
    ('mINSTsg', 'mINSTsg'),

    # Neuter forms.
    ('nNOMsg', 'nNOMsg'),
    ('nACCsg', 'nACCsg'),
    ('nGENsg', 'nGENsg'),
    ('nLOCsg', 'nLOCsg'),
    ('nDATsg', 'nDATsg'),
    ('nINSTsg', 'nINSTsg'),

    # Feminine forms.
    ('fNOMsg', 'fNOMsg'),
    ('fACCsg', 'fACCsg'),
    ('fGENsg', 'fGENsg'),
    ('fLOCsg', 'fLOCsg'),
    ('fDATsg', 'fDATsg'),
    ('fINSTsg', 'fINSTsg'),
    ('fINSTaltsg', 'fINSTaltsg'),

    # Short forms of adjectives
    ('mshort', 'mshort'),
    ('nshort', 'nshort'),
    ('fshort', 'fshort'),
    ('plshort', 'plshort'),

    # Comparatives
    ('comparative', 'comparative'),
    ('extracomparatives', 'comparative'),
]
VERB_CONJUGATIONS = [
    ('sg1', 'sg1'),
    ('sg2', 'sg2'),
    ('sg3', 'sg3'),
    ('pl1', 'pl1'),
    ('pl2', 'pl2'),
    ('pl3', 'pl3'),
    ('Mpast', 'Mpast'),
    ('Fpast', 'Fpast'),
    ('Npast', 'Npast'),
    ('Ppast', 'Ppast'),
    ('Imper_sg', 'Imper_sg'),
    ('Imper_pl', 'Imper_pl'),
    ('PrAP', 'PrAP'),
    ('PrAP_forms', 'PrAP'),
    ('PAP', 'PAP'),
    ('PAP_forms', 'PAP'),
    ('PrPP', 'PrPP'),
    ('PrPP_forms', 'PrPP'),
    ('PPP', 'PPP'),
    ('PPP_forms', 'PPP'),
    ('VbAdv1', 'VbAdv1'),
    ('VbAdv2', 'VbAdv2'),
    ('Infinitive', 'Infinitive'),
]



# ------------------------------------------------------------------
# Functions


def create_schema(cursor):
    with open(os.path.join(FILE_DIR, 'schema.sql'), 'r', encoding='utf-8') as f:
        schema = f.read()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.executescript(schema)


def process_data(cursor, filename):
    '''
    First pass at inserting the data from the CSV.
    '''
    with open(filename, encoding='utf-8') as csvfile:
        csvreader = csv.DictReader(csvfile, fieldnames=CSV_FIELD_NAMES)
        for rowid, rowdata in enumerate(csvreader, start=1):
            if rowid == 1:
                continue
            row = normalize_row(rowdata)
            if can_insert_lemma(row):
                inserted_lemma = insert_lemma(cursor, row)
                insert_aspect_counterpart(cursor, inserted_lemma, row)
                insert_inflections(cursor, inserted_lemma, row)
                insert_mwes(cursor, inserted_lemma, row)

    insert_missing_inflections(cursor)
    cleanup_aspect_counterparts(cursor)
    insert_aspect_pairs(cursor)


def normalize_row(rowdata):
    '''
    Normalizes the data from a single row of the spreadsheet.
    '''
    row = rowdata.copy()

    ### Normalize unicode for the primary and secondary Russian fields
    row['Russian'] = unicode_normalize(row['Russian'])
    row['SecondRussian'] = unicode_normalize(row['SecondRussian'])

    ### Strip any extra whitespace that was introduced in the spreadsheet cells
    for colname, colvalue in row.items():
        row[colname] = colvalue.strip()

    ### Strip whitespace around commas inside some specific cells
    # General Note:
    #       We don't strip whitespace around commas for all fields, because in some fields,
    #       such as the "English" definition, this whitespace is significant.
    # Historical Note: In previous versions of the spreadsheet, these fields
    #       contained semicolons to separate multiple values within a cell. The only
    #       reason they were semicolons was to avoid parsing issues with other systems
    #       that handled CSV. In Oct 2021, these semicolons were replaced with commas.
    for colname in ('Russian', 'Strеssеd_Russiаn', 'POS_Subtype', 'Stress_Pattern_SEMU'):
        if COMMA in row[colname]:
            row[colname] = COMMA.join([s.strip() for s in row[colname].split(COMMA)])
    
    return row


def insert_missing_inflections(cursor):
    '''
    Inserts missing inflections (e.g. due to punctuation variations).
    This should ideally be handled by updating the original data source (e.g. spreadsheet/CSV).
    '''
    missing_lemma_forms = [
        # lemma, form
        ("потому что", "потому, что"),
    ]

    for (lemma, form) in missing_lemma_forms:
        cursor.execute("SELECT 1 FROM inflection WHERE form = ? AND NOT EXISTS (SELECT 1 FROM inflection WHERE form = ?)", [lemma, form])
        row = cursor.fetchone()
        if row is None:
            sql = "INSERT INTO inflection (lemma_id, form, stressed, type, frequency) SELECT lemma_id, ?, stressed, type, frequency FROM inflection WHERE form = ?"
            cursor.execute(sql, [form, lemma])


def insert_aspect_counterpart(cursor, inserted_lemma, row):
    '''
    Inserts aspect counterpart for a given verb.
    '''
    lemma_pk = inserted_lemma['id']
    lemma = inserted_lemma['lemma']
    count = inserted_lemma['count']
    aspect = inserted_lemma['aspect']
    if not aspect:
        return

    second_russian = row['SecondRussian']
    if second_russian == lemma or second_russian in EMPTY_VALS:
        logging.debug(f"Verb {lemma} has no aspect counterpart. SecondRussian field is: {second_russian}")
        return

    counterparts = [second_russian]
    if COMMA in second_russian:
        counterparts = [s for s in second_russian.split(COMMA) if s != lemma]

    sql = 'INSERT INTO aspect_counterpart (lemma_id, lemma_label, lemma_count, aspect, counterpart, counterpart_index) VALUES (?, ?, ?, ?, ?, ?)'
    inserts = []
    for index, counterpart in enumerate(counterparts):
        inserts.append([lemma_pk, lemma, count, aspect, counterpart, index])

    for insert in inserts:
        try:
            logging.debug("insert aspect_counterpart: %s" % insert)
            cursor.execute(sql, insert)
        except sqlite3.Error as e:
            logging.exception("inflection: %s" % insert)
            raise e


def cleanup_aspect_counterparts(cursor):
    '''
    Ensures that every counterpart entry in the aspect_counterpart table actually exists in the lemma table.
    '''
    sql = 'DELETE FROM aspect_counterpart WHERE NOT EXISTS (SELECT 1 FROM lemma WHERE aspect_counterpart.counterpart = lemma.lemma)'
    cursor.execute(sql)


def insert_aspect_pairs(cursor):
    '''
    Inserts relations for imperfective/perfective aspect pairs for verbs
    (as identified by "SecondRussian" in the original spreadsheet).

    Assumes that every verb entry (lemma or counterpart) has an entry in the main lemma table.
    '''

    # partition verbs into buckets according to aspect
    cursor.execute("SELECT id, lemma_id, lemma_label, lemma_count, aspect, counterpart, counterpart_index FROM aspect_counterpart ORDER BY lemma_id, counterpart_index")
    aspect_counterpart_rows = cursor.fetchall()
    aspects = {"imperfective": {}, "perfective": {}, "biaspectual": {}}
    for row in aspect_counterpart_rows:
        pk, lemma_id, lemma_label, lemma_count, aspect, counterpart, counterpart_index = row
        aspects[aspect].setdefault(lemma_label, []).append(counterpart)

    # pair up imperfective/perfective verbs
    #
    # 1) it's possible that there's a perfective/imperfective entry but not a imperfective/perfective entry
    # which is why we need to iterate over both aspects.
    # 2) it's possible that an imperfective may have multiple possible perfective counterparts:
    #   играть/сыграть
    #   играть/поиграть
    #   играть/заиграть
    pairs = {}
    for imperfective, counterparts in aspects["imperfective"].items():
        perfective = counterparts[0]
        pairs[(imperfective, perfective)] = True
    for perfective, counterparts in aspects["perfective"].items():
        imperfective = counterparts[0]
        pairs[(imperfective, perfective)] = True

    # get mapping of lemmas in the database
    cursor.execute("SELECT lemma, id, count FROM lemma")
    lookup = {row[0]: {"lemma_id": row[1], "lemma_count": row[2]} for row in cursor.fetchall()}

    # generate inserts of pairs
    inserts = []
    for pair_id, pair_key in enumerate(sorted(pairs.keys()), start=1):
        (imperfective, perfective) = pair_key
        pair_name = f"{imperfective}-{perfective}"
        pair_index = 0
        if imperfective in aspects["imperfective"] and perfective in aspects["imperfective"][imperfective]:
            pair_index = aspects["imperfective"][imperfective].index(perfective)

        inserts.append([pair_id, pair_name, pair_index, "imperfective", lookup[imperfective]["lemma_id"], imperfective, lookup[imperfective]["lemma_count"]])
        inserts.append([pair_id, pair_name, pair_index, "perfective", lookup[perfective]["lemma_id"], perfective, lookup[perfective]["lemma_count"]])

    sql = "INSERT INTO aspect_pair (pair_id, pair_name, pair_index, aspect, lemma_id, lemma_label, lemma_count) VALUES (?, ?, ?, ?, ?, ?, ?)"
    for insert in inserts:
        try:
            logging.debug("Insert aspect_pair: %s" % insert)
            cursor.execute(sql, insert)
        except sqlite3.Error as e:
            logging.exception("aspect_pair: %s" % insert)
            raise e


def can_insert_lemma(row):
    '''
    Returns true if the row contains a valid lemma that should be added to the DB.
    Notes:
        - A row MUST have a "UniqueId" defined in order for it to be inserted.
        - It also must have a "Level" that isn't omitted. The only level omitted
          currently is "6O", since Steven Clancy uses this to mark items that
          don't fit into the schema right now (includes some MWEs, for example).
    '''
    if not row['UniqueId']:
        return False
    if row['Level'] == "6O":
        return False
    return True


def insert_lemma(cursor, row):
    data = {
        'external_id':         row['UniqueId'],
        'lemma':               row['Russian'],
        'stressed':            row['Strеssеd_Russiаn'],
        'translation':         row['English'],
        'pos':                 row['POS'],
        'pos_subtype':         row['POS_Subtype'],
        'rank':                row['Rank'],
        'count':               row['Count'],
        'level':               row['Level'],
        'gender':              row['Gender'],
        'animacy':             row['Animacy'],
        'stem':                row['stem'],
        'ending':              row['ending'],
        'domain':              row['Domain'],
        'aspect':              row['Aspect'],
        'transitivity':        row['Transitivity'],
        'stress_pattern_semu': row['Stress_Pattern_SEMU'],
        'prefixes':            row['Prefixes'],
        'roots':               row['Roots'],
        'suffixes':            row['Suffixes'],
    }
    items = data.items()
    fieldstr = ','.join(["'%s'" % k for k, v in items])
    valstr = ','.join(['?' for k, v in items])
    values = [v for k, v in items]
    sql = 'INSERT INTO lemma (%s) VALUES (%s)' % (fieldstr, valstr)
    try:
        cursor.execute(sql, values)
    except sqlite3.Error as e:
        logging.error(sql)
        logging.exception("lemma insert: %s" % values)
        raise e
    data['id'] = cursor.lastrowid
    return data


def insert_inflections(cursor, inserted_lemma, row):
    lemma_pk = inserted_lemma['id']
    sql = 'INSERT INTO inflection (lemma_id, form, stressed, type, frequency) VALUES (?, ?, ?, ?, ?)'
    inserts = []

    if row['POS'] in POS['inflected']:
        inserts = handle_inflected_forms(lemma_pk, row) # Nouns, Adjectives, Pronouns, Cardinal Numbers, etc
    elif row['POS'] in POS['noninflected']:
        inserts = handle_noninflected_forms(lemma_pk, row) # Adverbs, Conjunctions, Particles, etc
    elif row['POS'] == 'verb':
        inserts = handle_verb_forms(lemma_pk, row)
    else:
        raise Exception("Unhandled part of speech!")

    # If we did not generate any inserts, add a single word entry for the lemma
    if len(inserts) == 0:
        inserts = handle_lemma_forms(lemma_pk, row)

    logging.debug("[%s:%s] %s => %d inserts (%s)\n" % (row['UniqueId'], row['POS'], row['Russian'], len(inserts), ",".join([insert[3] for insert in inserts])))

    for insert in inserts:
        try:
            cursor.execute(sql, insert)
        except sqlite3.Error as e:
            logging.exception("inflection: %s" % insert)
            raise e


def insert_mwes(cursor, inserted_lemma, row):
    """
    Inserts MWEs or sequences of 2 or more words that should be treated
    as a single unit of meaning.

    This will insert any values that occur with a part-of-speech subtype that starts with "mwe".
    There are several possibilities, such as:
        - mwe
        - mwe, conditional
        - mwe, proper,
        - mwe, temporal
    """
    if not row['POS_Subtype'].startswith('mwe'):
        return

    lemma_pk = inserted_lemma['id']
    sql = 'INSERT INTO mwe (text, cardinality, lemma_id) VALUES (?, ?, ?)'

    inserts = []
    for text in (row['Russian'], row['SecondRussian']):
        words = [w for w in re.split(r'[ ,.]', text) if w != ""]
        cardinality = len(words)
        if cardinality >= 2:
            inserts.append([text, cardinality, lemma_pk])

    for insert in inserts:
        try:
            cursor.execute(sql, insert)
        except sqlite3.Error as e:
            logging.exception("inflection: %s" % insert)
            raise e

    logging.debug("[%s:%s:%s] %d inserts (%s)\n" % (row['UniqueId'], row['POS'], row['POS_Subtype'], len(inserts), [insert[0] for insert in inserts]))


def get_row_freq(row, colname):
    frequency = row.get('Freq_%s' % colname, '')
    if frequency in EMPTY_VALS:
        frequency = row.get('%sFreq' % colname, '')
    if frequency in EMPTY_VALS:
        frequency = None
    return frequency


def get_cell_multi_forms(form, stressed=''):
    forms_with_stressed = []
    if COMMA in form:
        forms = [f for f in form.strip().split(COMMA) if f not in EMPTY_VALS]
        stressed_forms = [s.strip() for s in stressed.strip().split(COMMA) if s and s not in EMPTY_VALS]
        if len(stressed_forms) == len(forms):
            forms_with_stressed = list(zip(forms, stressed_forms))
        else:
            for index, form in enumerate(forms):
                try:
                    forms_with_stressed.append((form, stressed[index]))
                except IndexError:
                    forms_with_stressed.append((form, ''))
    elif form:
        forms_with_stressed.append((form, stressed))

    return forms_with_stressed


def has_second_russian(row):
    if row['POS'] in ('phrase', 'prefix', 'prep'):
        return True
    if 'mwe' in row['POS_Subtype']:
        return True
    return False


def handle_inflected_forms(pk, row):
    inserts = []
    uniq = {}
    for declension in DECLENSIONS:
        colname, inflection_type = declension
        form = row[colname]
        if form in EMPTY_VALS:
            form = ''
        stressed = row.get('%s_stressed' % colname, '')
        frequency = get_row_freq(row, colname)
        forms_with_stressed = get_cell_multi_forms(form, stressed)
        if has_second_russian(row):
            secondary_forms_with_stressed = get_cell_multi_forms(row['SecondRussian'])
            forms_with_stressed.extend(secondary_forms_with_stressed)

        for form, stressed in forms_with_stressed:
            if form + inflection_type not in uniq:
                uniq[form + inflection_type] = True
                inserts.append([pk, form.strip(), stressed, inflection_type, frequency])
    return inserts


def handle_noninflected_forms(pk, row):
    noninflected = POS['noninflected']
    inserts = []
    uniq = {}
    inflection_type = noninflected[row['POS']]
    form = row['Russian']
    if form in EMPTY_VALS:
        form = ''
    stressed = row['Strеssеd_Russiаn']
    frequency = None
    forms_with_stressed = get_cell_multi_forms(form, stressed)
    if has_second_russian(row):
        secondary_forms_with_stressed = get_cell_multi_forms(row['SecondRussian'])
        forms_with_stressed.extend(secondary_forms_with_stressed)

    for form, stressed in forms_with_stressed:
        if form + inflection_type not in uniq:
            uniq[form + inflection_type] = True
            inserts.append([pk, form.strip(), stressed, inflection_type, frequency])
    return inserts


def handle_verb_forms(pk, row):
    inserts = []
    uniq = {}
    for conjugation in VERB_CONJUGATIONS:
        colname, inflection_type = conjugation
        form = row[colname]
        if form in EMPTY_VALS:
            form = ''
        frequency = get_row_freq(row, colname)
        stressed = row.get('%s_stressed' % colname, '')
        forms_with_stressed = get_cell_multi_forms(form, stressed)
        for form, stressed in forms_with_stressed:
            if form + inflection_type not in uniq:
                uniq[form + inflection_type] = True
                inserts.append([pk, form.strip(), stressed, inflection_type, frequency])
    return inserts


def handle_lemma_forms(pk, row):
    inserts = []
    colname = POS['inflected'].get(row['POS']) or POS['noninflected'].get(row['POS']) or ''
    forms_with_stressed = get_cell_multi_forms(row['Russian'], row['Strеssеd_Russiаn'])
    for form, stressed in forms_with_stressed:
        inserts.append([pk, form.strip(), stressed, colname, None])
    return inserts


def csv_get_fields(filename):
    """Returns a list of the column headers from the CSV file."""
    fields = []
    with open(filename, encoding='utf-8') as csvfile:
        csvreader = csv.DictReader(csvfile)
        count = 0
        for row in csvreader:
            count += 1
            if count == 2:
                fields = row.keys()
                break
    return fields


def unicode_normalize(str):
    return unicodedata.normalize('NFKC', unicodedata.normalize('NFKD', str))


def main(csvfile, dbfile):
    """Main task runner -- expected to be called from a script passing in the required arguments."""
    CONN = sqlite3.connect(dbfile)
    cursor = CONN.cursor()
    create_schema(cursor)
    process_data(cursor, csvfile)
    CONN.commit()
    CONN.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="Name of the CSV file with russian spreadsheet data.", default="NewVisualizingRussian21January2019.csv")
    parser.add_argument("--output", help="Name of the SQLite database.", default="russian.sqlite3")
    args = parser.parse_args()

    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
    logging.info("=> Processing...\n")
    start = time.time()
    main(args.input, args.output)
    end = time.time()

    logging.info("=> Completed. Execution time: %f seconds\n" % (end - start))
    logging.info("=> Database saved to %s\n" % args.output)
