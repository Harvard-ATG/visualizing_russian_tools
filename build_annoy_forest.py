from navec import Navec
from annoy import AnnoyIndex

# load navec vector file and extract vocabulary
path = 'parser_tool/data/navec_hudlit_v1_12B_500K_300d_100q.tar'
navec = Navec.load(path)
vocabulary = navec.vocab.words

# build annoy forest 
dim = 300
tree_count = 100
forest = AnnoyIndex(dim, 'angular') 

for i, word in enumerate(vocabulary):
    forest.add_item(i, navec[word])

forest.build(tree_count) 

# save forest
forest.save('parser_tool/data/ANNOY_tree.ann')