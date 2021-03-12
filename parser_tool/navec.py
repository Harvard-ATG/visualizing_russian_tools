import time
import os.path

from django.conf import settings

from navec import Navec
from numpy import dot
from numpy.linalg import norm
from annoy import AnnoyIndex


NAVEC_PATH = os.path.join(settings.ROOT_DIR, "parser_tool", "data", "navec_hudlit_v1_12B_500K_300d_100q.tar")
ANNOY_INDEX_PATH = os.path.join(settings.ROOT_DIR, "parser_tool", "data", "ANNOY_tree.ann")

navec = Navec.load(NAVEC_PATH)
vocabulary = navec.vocab.words
word_to_index = dict()
for i, word in enumerate(vocabulary):
    word_to_index[word] = i

lsh = None # global that holds the Annoy tree

def load_annoy_index():
    ''' 
    Lazy load the Annoy LSH tree.

    This is wrapped in a function to avoid import errors if the index file
    is not present at that time.
    '''
    global lsh
    if lsh is None:
        lsh = AnnoyIndex(300, 'angular')
        lsh.load(ANNOY_INDEX_PATH) # super fast, will just mmap the file

def getSimilarLSH(text):
    load_annoy_index()
    start = time.time()
    idx = word_to_index[text.strip()]
    indices = lsh.get_nns_by_item(idx, 100)
    neighbors = []
    for idx in indices:
        similarity = cos_sim(navec[vocabulary[idx]], navec[text])
        neighbors.append({
            "word" : vocabulary[idx],
            "vector" : list(float(v) for v in navec[vocabulary[idx]]),
            "similarity" : float(similarity)
        })
    end = time.time()
    return neighbors, (end - start)

def cos_sim(a,b):
    return dot(a, b)/(norm(a)*norm(b))

def getSimilarBruteForce(text, tolerance=.3):
    embedding0 = navec[text]
    above_tol = []
    begin_sim = time.time()
    for word in vocabulary:
        embedding1 = navec[word]
        similarity = cos_sim(embedding0, embedding1)
        if similarity > tolerance:
            above_tol.append({
                "word" : word,
                "vector" : list(float(v) for v in navec[word]),
                "similarity" : float(similarity)
            })
    end_sim = time.time()
    above_tol = sorted(above_tol, reverse=True, key=lambda pair: pair["similarity"])
    return above_tol, (end_sim - begin_sim)