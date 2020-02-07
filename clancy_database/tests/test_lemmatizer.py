# -*- coding: utf-8 -*-
import unittest
from clancy_database import queries


class TestLookupTable(unittest.TestCase):
    # TODO: convert this into a proper fixture
    LOOKUP_TABLE_UNSORTED = {
        'forms': {
            661935: {
                'id': 661935,
                'type': 'noun',
                'label': 'Рыбы',
                'stressed': 'Ры́бы',
                'frequency': None,
                'lemma_id': 33036
            },
            12997: {
                'id': 12997,
                'type': 'GENsg',
                'label': 'рыбы',
                'stressed': 'ры́бы',
                'frequency': 31.35,
                'lemma_id': 637
            },
            13002: {
                'id': 13002,
                'type': 'NOMpl',
                'label': 'рыбы',
                'stressed': 'ры́бы',
                'frequency': 31.35,
                'lemma_id': 637
            }
        },
        'lemmas': {
            637: {
                'id': 637,
                'label': 'рыба',
                'stressed': 'ры́ба',
                'translation': 'fish (as food or animal)',
                'level': '1E',
                'count': 22.71,
                'rank': 908,
            },
            33036: {
                'id': 33036,
                'label': 'Рыбы',
                'stressed': 'Ры́бы',
                'translation': 'Pisces',
                'level': '6O',
                'count': 0.0,
                'rank': 90000,
            }
        },
        'lookup': {
            'рыбы': [661935, 13002, 12997]
        }
    }

    def test_sortlookup(self):
        unsorted_lookup = self.LOOKUP_TABLE_UNSORTED["lookup"]
        sorted_lookup = queries.sortlookup(self.LOOKUP_TABLE_UNSORTED)
        self.assertEqual(set(unsorted_lookup.keys()), set(sorted_lookup.keys()))
        expected_form_ids = [12997, 13002, 661935] # sorted by ascending level, ascending rank
        self.assertNotEqual(unsorted_lookup['рыбы'], sorted_lookup['рыбы'])
        self.assertEqual(expected_form_ids, sorted_lookup['рыбы'])
