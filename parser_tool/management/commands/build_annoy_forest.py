import os
import os.path

from annoy import AnnoyIndex
from django.conf import settings
from django.core.management.base import BaseCommand
from navec import Navec

NAVEC_PATH = os.path.join(settings.ROOT_DIR, "parser_tool", "data", "navec_hudlit_v1_12B_500K_300d_100q.tar")
ANNOY_INDEX_PATH = os.path.join(settings.ROOT_DIR, "parser_tool", "data", "ANNOY_tree.ann")


class Command(BaseCommand):
    help = """
Loads navec vector file, extracts vocabulary, and builds a static index file that can 
be used for fast nearest neighbor queries.

See also: https://github.com/spotify/annoy
"""

    def add_arguments(self, parser):
        parser.add_argument("--navecfile", required=False, help="Navec file used to generate ANNOY index.", default=NAVEC_PATH)

    def handle(self, *args, **options):
        self.build_annoy_forest(navec_path=options["navecfile"], index_path=ANNOY_INDEX_PATH)

    def build_annoy_forest(self, navec_path, index_path):
        # load navec vector file and extract vocabulary
        navec = Navec.load(navec_path)
        vocabulary = navec.vocab.words

        # build annoy forest
        dim = 300
        tree_count = 100
        forest = AnnoyIndex(dim, "angular")

        for i, word in enumerate(vocabulary):
            forest.add_item(i, navec[word])

        forest.build(tree_count)
        forest.save(index_path)
