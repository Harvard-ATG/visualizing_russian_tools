from navec import Navec
from numpy import dot
from numpy.linalg import norm
from annoy import AnnoyIndex
import time

path = 'parser_tool/static/js/src/data/navec_hudlit_v1_12B_500K_300d_100q.tar'
navec = Navec.load(path)
vocabulary = navec.vocab.words
word_to_index = dict()
for i, word in enumerate(vocabulary):
    word_to_index[word] = i

# load Annoy LSH tree
lsh = AnnoyIndex(300, 'angular')
lsh.load('parser_tool/static/js/src/ANNOY_tree.ann') # super fast, will just mmap the file

def getSimilarLSH(text):
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

def getSimilarBruteForce(text, tolerance=.5):
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