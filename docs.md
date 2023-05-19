# Visualizing Russian - Reference for Developers

### (Navec) Similarity Tool

#### Description of tool
A user enters a word and then can choose whether to generate nearest neighbors (similar words) through LSH or brute force methods. LSH is approximate but faster and brute force is longer but more accurate to the Navec dataset. As of 5/18/23 there is a table of similar words generated and a 2-D embedding graph of those nearest neighbors projected from 300-D to 2-D. 

#### Relevant topics/keywords
Nearest neighbors, locality sensitive hashing, word embeddings, principal component analysis

#### Files pertinent to the Similarity Tool:

- `parser_tool/static/js/src/navec.js`: Calls the nearest neighbor API (LSH or Brute Force options); projects Navec vectors from 300-D to 2-D; draws table, scatterplot, and accompanying elements;

- `parser_tool/static/templates/parser_tool/similarity.html`: HTML page for rendering Similarity Tool

- `parser_tool/navec.py`: Loads navec and annoy data, uses cosine similarity to determine nearest neighbors. For LSH, there is a built-in nearest neighbors function that pre-loads the NNs based on LSH. For Brute Force, cosine similarity is calculated between the target word and each other word in the Navec dictionary. For both methods, these nearest neighbor words, their 300-D Navec vector, and their similarity value (0-1) is returned. Loads the .tar and .ann files below. 

#### Relevant data files (loaded in `navec.py`):

- `parser_tool/data/navec_hudlit_v1_12B_500K_300d_100q.tar`: this data file is from the Navec Github repository and contains hundreds of thousands of 300-D vectors. It is used in conjunction with the Navec Python library. 

- `parser_tool/data/ANNOY_tree.ann`: he bulk of the ".ann" file contains the serialized representation of the Annoy index structure. This includes information about the split points, hyperplanes, and other necessary details for efficiently traversing and searching the index as well as info about the nearest neighbor data points themselves. A large file. 

#### Relevant Python libraries: [Navec](https://github.com/natasha/navec) (Russian NLP library), [annoy](https://github.com/spotify/annoy) (Approximate Nearest Neighbors). 

