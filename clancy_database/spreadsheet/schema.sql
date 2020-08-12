-----------------------------------------------------------------------
-- MAIN TABLES populated from spreadsheet

-- Lemma table to hold all of the lemmas
CREATE TABLE IF NOT EXISTS lemma (
  id                    INTEGER PRIMARY KEY,
  external_id           INTEGER UNIQUE,
  lemma                 TEXT NOT NULL,
  stressed              TEXT NOT NULL,
  translation           TEXT NOT NULL,
  pos                   TEXT NOT NULL,
  pos_subtype           TEXT NOT NULL,
  level                 TEXT NOT NULL,
  gender                TEXT,
  animacy               TEXT,
  stem                  TEXT NOT NULL,
  ending                TEXT NOT NULL,
  domain                TEXT NOT NULL,
  aspect                TEXT NOT NULL,
  transitivity          TEXT,
  stress_pattern_semu   TEXT,
  rank                  INTEGER,
  count                 REAL,

  FOREIGN KEY (pos) REFERENCES pos(key) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (level) REFERENCES level(key) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (gender) REFERENCES gender(key) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (aspect) REFERENCES aspect(key) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (animacy) REFERENCES animacy(key) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (transitivity) REFERENCES transitivity(key) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (stress_pattern_semu) REFERENCES stress_pattern_semu(key) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX lemma_lemma_index ON lemma(lemma);

-- Inflection table to hold all the forms
CREATE TABLE IF NOT EXISTS inflection (
  id                   INTEGER PRIMARY KEY,
  lemma_id             INTEGER NOT NULL,
  form                 TEXT NOT NULL,
  stressed             TEXT NOT NULL,
  type                 TEXT NOT NULL, -- Grammatical type expressing features of the form such as gender, case, number or person, tense
  frequency            REAL,
  sharoff_freq         REAL,
  sharoff_rank         INTEGER,

  FOREIGN KEY (lemma_id) REFERENCES lemma(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (type) REFERENCES inflection_type(key) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX inflection_form_index ON inflection(form);

-- Aspect pair table for relating imperfective and perfective verbs
CREATE TABLE IF NOT EXISTS aspect_pair (
  id                     INTEGER PRIMARY KEY,
  pair_id                INTEGER NOT NULL,
  pair_name              TEXT NOT NULL,
  lemma_id               INTEGER NOT NULL,
  lemma_label            TEXT NOT NULL,
  lemma_count            REAL, -- This value should come from the lemma table; duplicated here for performance reasons
  aspect                 TEXT NOT NULL,

  FOREIGN KEY (lemma_id) REFERENCES lemma(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (aspect) REFERENCES aspect(key) ON DELETE RESTRICT ON UPDATE CASCADE
);

-----------------------------------------------------------------------
-- REFERENCE TABLES to enumerate possible values for particular fields
CREATE TABLE IF NOT EXISTS inflection_type (
  key                  TEXT PRIMARY KEY,
  description          TEXT NOT NULL
);

-- Singular
INSERT INTO inflection_type (key, description) VALUES ('', '');
INSERT INTO inflection_type (key, description) VALUES ('NOMsg', 'nominative singular');
INSERT INTO inflection_type (key, description) VALUES ('ACCsg', 'accusative singular');
INSERT INTO inflection_type (key, description) VALUES ('GENsg', 'genitive singular');
INSERT INTO inflection_type (key, description) VALUES ('GEN2sg', 'secondary genitive singular');
INSERT INTO inflection_type (key, description) VALUES ('GEN3sg', 'tertiary genitive singular');
INSERT INTO inflection_type (key, description) VALUES ('LOCsg', 'locative singular');
INSERT INTO inflection_type (key, description) VALUES ('LOC2sg', 'secondary locative singular');
INSERT INTO inflection_type (key, description) VALUES ('DATsg', 'dative singular');
INSERT INTO inflection_type (key, description) VALUES ('INSTsg', 'instrumental singular');
INSERT INTO inflection_type (key, description) VALUES ('INSTaltsg', 'alternative instrumental singular');
INSERT INTO inflection_type (key, description) VALUES ('VOCsg', 'vocative singular');
-- Plural
INSERT INTO inflection_type (key, description) VALUES ('NOMpl', 'nominative plural');
INSERT INTO inflection_type (key, description) VALUES ('ACCpl', 'accusative plural');
INSERT INTO inflection_type (key, description) VALUES ('GENpl', 'genitive plural');
INSERT INTO inflection_type (key, description) VALUES ('LOCpl', 'locative plural');
INSERT INTO inflection_type (key, description) VALUES ('DATpl', 'dative pural');
INSERT INTO inflection_type (key, description) VALUES ('INSTpl', 'instrumental plural');
INSERT INTO inflection_type (key, description) VALUES ('plNOMpl', 'nominative plural');
INSERT INTO inflection_type (key, description) VALUES ('plACCplAN', 'accusative plural animate');
INSERT INTO inflection_type (key, description) VALUES ('plACCplIN', 'accusative plural inanimate');
INSERT INTO inflection_type (key, description) VALUES ('plGENpl', 'genitive plural');
INSERT INTO inflection_type (key, description) VALUES ('plLOCpl', 'locative plural');
INSERT INTO inflection_type (key, description) VALUES ('plDATpl', 'dative plural');
INSERT INTO inflection_type (key, description) VALUES ('plINSTpl', 'instrumental plural');
-- Short forms of adjectives
INSERT INTO inflection_type (key, description) VALUES ('mshort', 'masculine short');
INSERT INTO inflection_type (key, description) VALUES ('nshort', 'neuter short');
INSERT INTO inflection_type (key, description) VALUES ('fshort', 'feminine short');
INSERT INTO inflection_type (key, description) VALUES ('plshort', 'plural short');
-- Comparatives
INSERT INTO inflection_type (key, description) VALUES ('comparative', 'comparative');
-- Masculine forms
INSERT INTO inflection_type (key, description) VALUES ('mNOMsg', 'masculine nominative singular');
INSERT INTO inflection_type (key, description) VALUES ('mACCsgAN', 'masculine accusative singular animate');
INSERT INTO inflection_type (key, description) VALUES ('mACCsgIN', 'masculine accusative singular inanimate');
INSERT INTO inflection_type (key, description) VALUES ('mGENsg', 'masculine genitive singular');
INSERT INTO inflection_type (key, description) VALUES ('mLOCsg', 'masculine locative singular');
INSERT INTO inflection_type (key, description) VALUES ('mDATsg', 'masculine dative singular');
INSERT INTO inflection_type (key, description) VALUES ('mINSTsg', 'masculine instrumental singular');
-- Neuter forms
INSERT INTO inflection_type (key, description) VALUES ('nNOMsg', 'neuter nominative singular');
INSERT INTO inflection_type (key, description) VALUES ('nACCsg', 'neuter accusative singular');
INSERT INTO inflection_type (key, description) VALUES ('nGENsg', 'neuter genitive singular');
INSERT INTO inflection_type (key, description) VALUES ('nLOCsg', 'neuter locative singular');
INSERT INTO inflection_type (key, description) VALUES ('nDATsg', 'neuter dative singular');
INSERT INTO inflection_type (key, description) VALUES ('nINSTsg', 'neuter instrumental singular');
-- Feminine forms
INSERT INTO inflection_type (key, description) VALUES ('fNOMsg', 'feminine nominative singular');
INSERT INTO inflection_type (key, description) VALUES ('fACCsg', 'feminine accusative singular');
INSERT INTO inflection_type (key, description) VALUES ('fGENsg', 'feminine genitive singular');
INSERT INTO inflection_type (key, description) VALUES ('fLOCsg', 'feminine locative singular');
INSERT INTO inflection_type (key, description) VALUES ('fDATsg', 'feminine dative singular');
INSERT INTO inflection_type (key, description) VALUES ('fINSTsg', 'feminine instrumental singular');
INSERT INTO inflection_type (key, description) VALUES ('fINSTaltsg', 'feminine alternative instrumental singular');
-- Verb Conjugations
INSERT INTO inflection_type (key, description) VALUES ('sg1', 'first person singular');
INSERT INTO inflection_type (key, description) VALUES ('sg2', 'second person singular');
INSERT INTO inflection_type (key, description) VALUES ('sg3', 'third person singular');
INSERT INTO inflection_type (key, description) VALUES ('pl1', 'first person plural');
INSERT INTO inflection_type (key, description) VALUES ('pl2', 'second person singular');
INSERT INTO inflection_type (key, description) VALUES ('pl3', 'third person plural');
INSERT INTO inflection_type (key, description) VALUES ('Mpast', 'masculine past');
INSERT INTO inflection_type (key, description) VALUES ('Fpast', 'feminine past');
INSERT INTO inflection_type (key, description) VALUES ('Npast', 'neuter past');
INSERT INTO inflection_type (key, description) VALUES ('Ppast', 'plural past');
INSERT INTO inflection_type (key, description) VALUES ('Imper_sg', 'imperative singular');
INSERT INTO inflection_type (key, description) VALUES ('Imper_pl', 'imperative plural');
INSERT INTO inflection_type (key, description) VALUES ('PrAP', 'present active participle');
INSERT INTO inflection_type (key, description) VALUES ('PAP', 'past active participle');
INSERT INTO inflection_type (key, description) VALUES ('PrPP', 'present passive participle');
INSERT INTO inflection_type (key, description) VALUES ('PPP', 'past passive participle');
INSERT INTO inflection_type (key, description) VALUES ('VbAdv1', 'verbal adverb');
INSERT INTO inflection_type (key, description) VALUES ('VbAdv2', 'secondary verbal adverb');
INSERT INTO inflection_type (key, description) VALUES ('Infinitive', 'infinitive');
-- Noninflected
INSERT INTO inflection_type (key, description) VALUES ('adverb','adverb');
INSERT INTO inflection_type (key, description) VALUES ('adjectival adverb', 'adjectival adverb');
INSERT INTO inflection_type (key, description) VALUES ('conjunction', 'conjunction');
INSERT INTO inflection_type (key, description) VALUES ('discourse', 'discourse');
INSERT INTO inflection_type (key, description) VALUES ('function', 'function');
INSERT INTO inflection_type (key, description) VALUES ('miscellaneous', 'miscellaneous');
INSERT INTO inflection_type (key, description) VALUES ('phrase', 'phrase');
INSERT INTO inflection_type (key, description) VALUES ('prefix', 'prefix');
INSERT INTO inflection_type (key, description) VALUES ('preposition', 'preposition');
INSERT INTO inflection_type (key, description) VALUES ('adjective', 'adjective');
INSERT INTO inflection_type (key, description) VALUES ('adjective pronoun', 'adjective pronoun');
INSERT INTO inflection_type (key, description) VALUES ('noun', 'noun');
INSERT INTO inflection_type (key, description) VALUES ('numeral', 'numeral');
INSERT INTO inflection_type (key, description) VALUES ('ordinal', 'ordinal');
INSERT INTO inflection_type (key, description) VALUES ('pronoun', 'pronoun');

CREATE TABLE IF NOT EXISTS gender (
  key                  TEXT PRIMARY KEY,
  description          TEXT NOT NULL
);
INSERT INTO gender (key, description) VALUES ('', '');
INSERT INTO gender (key, description) VALUES ('masc', 'masculine');
INSERT INTO gender (key, description) VALUES ('fem', 'feminine');
INSERT INTO gender (key, description) VALUES ('neut', 'neuter');
INSERT INTO gender (key, description) VALUES ('comm', 'common');


CREATE TABLE IF NOT EXISTS level (
  key                  TEXT PRIMARY KEY,
  description          TEXT NOT NULL
);
INSERT INTO level (key, description) VALUES ('', '');
INSERT INTO level (key, description) VALUES ('1E', 'core');
INSERT INTO level (key, description) VALUES ('2I', 'foundations');
INSERT INTO level (key, description) VALUES ('3A', 'expansions');
INSERT INTO level (key, description) VALUES ('3AU', '');
INSERT INTO level (key, description) VALUES ('4S', 'specializations');
INSERT INTO level (key, description) VALUES ('4SU', '');
INSERT INTO level (key, description) VALUES ('6O', '');


CREATE TABLE IF NOT EXISTS animacy (
  key                  TEXT PRIMARY KEY,
  description          TEXT NOT NULL
);
INSERT INTO animacy (key, description) VALUES ('', '');
INSERT INTO animacy (key, description) VALUES ('animate', 'animate');
INSERT INTO animacy (key, description) VALUES ('inanimate', 'inanimate');


CREATE TABLE IF NOT EXISTS transitivity (
  key                  TEXT PRIMARY KEY,
  description          TEXT NOT NULL
);
INSERT INTO transitivity (key, description) VALUES ('', '');
INSERT INTO transitivity (key, description) VALUES ('transitive', 'transitive');
INSERT INTO transitivity (key, description) VALUES ('intransitive', 'intransitive');


CREATE TABLE IF NOT EXISTS aspect (
  key                  TEXT PRIMARY KEY,
  description          TEXT NOT NULL
);
INSERT INTO aspect (key, description) VALUES ('', '');
INSERT INTO aspect (key, description) VALUES ('imperfective', 'imperfective');
INSERT INTO aspect (key, description) VALUES ('perfective', 'perfective');
INSERT INTO aspect (key, description) VALUES ('biaspectual', 'biaspectual');


CREATE TABLE IF NOT EXISTS pos (
  key                  TEXT PRIMARY KEY,
  description          TEXT NOT NULL
);
INSERT INTO pos (key, description) VALUES ('', '');
INSERT INTO pos (key, description) VALUES ('adj', 'adjective');
INSERT INTO pos (key, description) VALUES ('adjadv', 'adjectival adverb');
INSERT INTO pos (key, description) VALUES ('adjpron', 'adjectival pronoun');
INSERT INTO pos (key, description) VALUES ('adv', 'adverb');
INSERT INTO pos (key, description) VALUES ('conj', 'conjunction');
INSERT INTO pos (key, description) VALUES ('disc', 'discourse');
INSERT INTO pos (key, description) VALUES ('func', 'function');
INSERT INTO pos (key, description) VALUES ('misc', 'miscellaneous');
INSERT INTO pos (key, description) VALUES ('noun', 'noun');
INSERT INTO pos (key, description) VALUES ('num', 'numeral');
INSERT INTO pos (key, description) VALUES ('phrase', 'phrase');
INSERT INTO pos (key, description) VALUES ('prefix', 'prefix');
INSERT INTO pos (key, description) VALUES ('prep', 'preposition');
INSERT INTO pos (key, description) VALUES ('pron', 'pronoun');
INSERT INTO pos (key, description) VALUES ('verb', 'verb');

CREATE TABLE IF NOT EXISTS stress_pattern_semu (
  key                  TEXT PRIMARY KEY,
  description          TEXT NOT NULL
);
INSERT INTO stress_pattern_semu (key, description) VALUES('', '');
INSERT INTO stress_pattern_semu (key, description) VALUES('EE', 'Singular end stress, Plural end stress');
INSERT INTO stress_pattern_semu (key, description) VALUES('EM', 'Singular end stress, Plural mixed stress');
INSERT INTO stress_pattern_semu (key, description) VALUES('ES', 'Singular end stress, Plural stem stress');
INSERT INTO stress_pattern_semu (key, description) VALUES('E_', 'Singular end stress, Plural does not occur');
INSERT INTO stress_pattern_semu (key, description) VALUES('SE', 'Singular stem stress, Plural end stress');
INSERT INTO stress_pattern_semu (key, description) VALUES('SM', 'Singular stem stress, Plural mixed stress');
INSERT INTO stress_pattern_semu (key, description) VALUES('SS', 'Singular stem stress, Plural stem stress');
INSERT INTO stress_pattern_semu (key, description) VALUES('S_', 'Singular stem stress, Plural does not occur');
INSERT INTO stress_pattern_semu (key, description) VALUES('UM', 'Singular u-retraction, Plural mixed stress');
INSERT INTO stress_pattern_semu (key, description) VALUES('US', 'Singular u-retraction, Plural stem stress');
INSERT INTO stress_pattern_semu (key, description) VALUES('_E', 'Singular does not occur, Plural end stress');
INSERT INTO stress_pattern_semu (key, description) VALUES('_M', 'Singular does not occur, Plural mixed stress');
INSERT INTO stress_pattern_semu (key, description) VALUES('_S', 'Singular does not occur, plural stem stress');
