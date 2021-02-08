from navec import Navec
from numpy import dot
from numpy.linalg import norm


def load_Navec():
    path = 'parser_tool/static/js/src/data/navec_hudlit_v1_12B_500K_300d_100q.tar'
    navec = Navec.load(path)
    return navec

def get_Navec_vec(text):
    navec = load_Navec()
    return navec[text]

def cos_sim(a,b):
    return dot(a, b)/(norm(a)*norm(b))

def similar_words(word, tolerance=.5):
    navec = load_Navec()
    embedding0 = navec[word]
    above_tol = list()
    vocabulary = navec.vocab.words
    for word in vocabulary:
        embedding1 = navec[word]
        similarity = cos_sim(embedding0, embedding1)
        if similarity > tolerance:
            above_tol.append((float(similarity), word))
    return(sorted(above_tol, reverse=True))