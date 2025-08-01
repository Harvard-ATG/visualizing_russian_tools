(function(global) {
    "use strict";

    const LemmaTrie = global.app.LemmaTrie;

    // utility that returns the distinct or unique values in an array
    const unique = (arr) => {
        let seen = {}, items = [];
        for(let i = 0, len = arr.length; i < len; i++) {
            if(!seen.hasOwnProperty(arr[i])) {
                seen[arr[i]] = true;
                items.push(arr[i]);
            }
        }
        return items;
    }

    const LOCALE_NAME = "ru-RU";
    const LOCALE_COMPARE = {sensitivity: "base", ignorePunctuation: true};

    class LemmatizedText {

        constructor(text, data) {
            data = data || {}; // lemmatization data
            this.text = text || ''; // original source text
            this._tokens = data.tokens || [];
            this._lemmas = data.lemmas || {};
            this._forms = data.forms || {};
            this._cache_forms_of = {}
            this._cache_lemmas_of = {};
            this._trie = null;
            this._defaultLevel = 5; // default level for uncategorized or undefined vocabulary
            this.init();
        }

        // returns a promise with an instance of a lemmatized text
        static asyncFromString({ api, text }) {
            text = text.trim();
            if(!text) {
                return Promise.resolve(new LemmatizedText());
            }
            // async request to lemmatize the text using the API client
            return api.lemmatizetext(text).then((res) => {
                return new LemmatizedText(text, res.data);
            });
        }

        init() {
            let trie = new LemmaTrie();

            let _forms = Object.values(this._forms);
            for(let i = 0; i < _forms.length; i++) {
                let form = _forms[i];
                let data = {
                    type: "form",
                    id: form.id,
                    capitalized: (form.label.charAt(0) == form.label.charAt(0).toUpperCase()),
                };
                trie.insert(form.label, data);
                trie.insert(form.stressed, data);
            }

            let _lemmas = Object.values(this._lemmas);
            for(let i = 0; i < _lemmas.length; i++) {
                let lemma = _lemmas[i];
                let data = {
                    type: "lemma",
                    id: lemma.id,
                    capitalized: (lemma.label.charAt(0) == lemma.label.charAt(0).toUpperCase())
                };
                trie.insert(lemma.label, data);
                trie.insert(lemma.stressed, data);
            }

            this._trie = trie;
        }

        // returns the source text
        getText() {
            return this.text;
        }

        // returns true if there are zero tokens
        empty() {
            return this._tokens.length == 0;
        }

        // returns a copy of the individual tokens from the lemmatized text
        tokens() {
            return this._tokens.map(o => o.token);
        }

        // returns a list of russian words in the order they appear (may contain duplicates)
        words() {
            return this._tokens.filter(o => o.tokentype == "RUS").map(o => o.token);
        }

        // returns a list of words that have been lemmatized (may contain duplicates)
        wordsLemmatized() {
            return this._tokens.filter(o => o.tokentype == "RUS" && o.form_ids.length > 0).map(o => o.token);
        }

        // returns a list of words that have not been lemmatized because there was no matching
        // form in the database ((may contain duplicates)
        wordsNotLemmatized() {
            return this._tokens.filter(o => o.tokentype == "RUS" && o.form_ids.length == 0).map(o => o.token)
        }

        // returns the set of lemmas or headwords in the text
        lemmas() {
            let lemmas = Object.values(this._lemmas).map(o => o.label);
            lemmas.sort((a, b) => a.localeCompare(b), LOCALE_NAME, LOCALE_COMPARE);
            return lemmas;
        }

        // returns the set of unique words in the text
        vocab() {
            let vocab = unique(this.words()).sort((a, b) => a.localeCompare(b, LOCALE_NAME, LOCALE_COMPARE));
            return vocab;
        }

        // iterate over each word in the text
        forEachWord(fn) {
            let _tokens = this._tokens;
            for(let i = 0, len = _tokens.length; i < len; i++) {
                if(_tokens[i].tokentype === "RUS") {
                    fn.call(this, _tokens[i].token, i, _tokens);
                }
            }
        }

        // map over each token in the text
        mapTokens(fn) {
            let results = [];
            let _tokens = this._tokens;
            for(let i = 0, len = _tokens.length; i < len; i++) {
                let result = fn.call(this, _tokens[i].token, _tokens[i].tokentype, i, _tokens);
                results.push(result);
            }
            return results;
        }

        // find first index where the word appears in the list of tokens
        indexOf(searchWord, fromIndex) {
            let _tokens = this._tokens;
            fromIndex = parseInt(fromIndex, 10);
            if(Number.isNaN(fromIndex)) {
                fromIndex = 0;
            }
            else if(fromIndex < 0 || fromIndex >= _tokens.length) {
                return -1;
            }
            for(let i = fromIndex; i < _tokens.length; i++) {
                let token = _tokens[i].token;
                if(token === searchWord) {
                    return i;
                }
            }
            return -1;
        }

        // lookup the lemmas of a word in the text
        lemmasOf(word, options) {
            options = options || {};

            const compare = {
                "level": (a, b) => parseInt(a.level) - parseInt(b.level),
                "rank": (a, b) => a.rank - b.rank
            };
            if(options.sort && !compare.hasOwnProperty(options.sort)) {
                throw new Exception(`invalid option sort=${options.sort}`);
            }

            if(this._cache_lemmas_of[word]) {
                let word_lemmas = this._cache_lemmas_of[word];
                if(options.sort) {
                    word_lemmas.sort(compare[options.sort]);
                }
                return word_lemmas;
            }

            let seen = {};
            let word_lemmas = [];
            let [d, node] = this._trie.find(word);
            if(d !== -1) {
                for(let i = 0; i < node.value.length; i++) {
                    let lemma_id = null;
                    let nodedata = node.value[i];
                    switch(nodedata.type) {
                        case "form":
                            lemma_id = this._forms[nodedata.id].lemma_id;
                            break;
                        case "lemma":
                            lemma_id = nodedata.id;
                            break;
                        default:
                            console.error(word, node, i);
                            throw new Exception("invalid node value index");
                    }
                    if(lemma_id) {
                        let lemma_obj = this._lemmas[lemma_id];
                        if(!seen.hasOwnProperty(lemma_id)) {
                            word_lemmas.push(lemma_obj);
                            seen[lemma_id] = true;
                        }
                    }

                }
            }

            word_lemmas.sort(compare[options.sort]);
            this._cache_lemmas_of[word] = word_lemmas;

            return word_lemmas;
        }

        // return the forms that matched the word in the text (e.g. "его" has two matching forms, one for accusative and one for genitive)
        formsOf(word) {
            if(this._cache_forms_of[word]) {
                return this._cache_forms_of[word];
            }

            let word_forms = [];
            let _forms = Object.values(this._forms);

            for(let i = 0; i < _forms.length; i++) {
                let form_obj = _forms[i];
                if(form_obj.label.localeCompare(word, LOCALE_NAME, LOCALE_COMPARE) == 0) {
                    word_forms.push(form_obj);
                }
            }

            this._cache_forms_of[word] = word_forms;

            return word_forms;
        }

        // returns true if the form is intended to be capitalized (e.g. proper name)
        isCapitalized(word) {
            let [d, node] = this._trie.find(word);
            if(d !== -1) {
                for(let i = 0; i < node.value.length; i++) {
                    let nodedata = node.value[i];
                    if(nodedata.capitalized) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Returns true if the lemmas are represented in the text, false otherwise.
        containsLemmas(lemmas) {
            for(let i = 0, len = lemmas.length; i < len; i++) {
                let matching_lemmas = this.lemmasOf(lemmas[i]);
                return matching_lemmas.length > 0;
            }
            return false;
        }

        // returns the total number of times each word appears in the text
        vocab_stats() {
            let counter = {};
            this.forEachWord((word) => {
                if(!this.isCapitalized(word)) {
                    word = word.toLowerCase();
                }
                if(!counter.hasOwnProperty(word)) {
                    counter[word] = 0;
                }
                counter[word]++;
            });

            let stats = Object.keys(counter)
                .map((w) => ({word: w, count: counter[w]}))
                .sort((a, b) => b.count - a.count);

            return stats;
        }

        // returns the total number of times each lemma appears in the text
        // NOTE: when there a word is associated with multiple lemmas, the default
        // strategy is to select the more frequently occurring lemma based on its "rank" value.
        lemma_stats() {
            let counter = {};
            this.forEachWord((word) => {
                let word_normalized = word.toLowerCase();
                let lemma_records = this.lemmasOf(word, {"sort": "rank"});
                let lemma = (lemma_records.length > 0 ? lemma_records[0] : false);
                if(lemma) {
                    if(!counter.hasOwnProperty(lemma.label)) {
                        counter[lemma.label] = {lemmatized: true, count: 0, words: {}};
                    }
                    counter[lemma.label].count++
                    if(!counter[lemma.label].words.hasOwnProperty(word_normalized)) {
                        counter[lemma.label].words[word_normalized] = 0;
                    }
                    counter[lemma.label].words[word_normalized]++;
                } else {
                    if(!counter.hasOwnProperty(word)) {
                        counter[word] = {lemmatized: false, count: 0, words: {}};
                    }
                    counter[word].count++;
                }
            });

            let stats = Object.keys(counter)
                .map((w) => ({word: w, count: counter[w].count, words: counter[w].words, lemmatized: counter[w].lemmatized}))
                .sort((a, b) => {
                    // lemmatized entries should come first, and then sort based on count
                    if(a.lemmatized && !b.lemmatized) {
                        return -1;
                    } else if(!a.lemmatized && b.lemmatized) {
                        return 1;
                    }
                    return b.count - a.count;
                });

            return stats;
        }

        // returns the number of times the word appears
        count(word) {
            let count = 0;
            this.forEachWord((iter_word) => {
                if(iter_word.localeCompare(word, LOCALE_NAME, LOCALE_COMPARE) == 0) {
                    count++;
                }
            });
            return count;
        }

        // returns a non-zero integer reprsenting the difficulty level associated with the word, or zero if no level could be assigned
        levelOf(word) {
            let level_num;
            let lemma_records = this.lemmasOf(word, {sort: "level"});
            let lemma = (lemma_records.length > 0 ? lemma_records[0] : false);
            if(lemma) {
                let parsed_level_num = parseInt(lemma.level, 10);
                if(!Number.isNaN(parsed_level_num)) {
                    level_num = parsed_level_num;
                }
            } else {
                // if no lemma was found, then assign default level
                level_num = this._defaultLevel;
            }
            return level_num;
        }

        // returns an array where the indexes represent the level numbers and the values represent the counts:
        //      Levels[0] = Count of Unparsed
        //      Levels[1] = Count at Level 1E
        //      Levels[2] = Count at Level 2I
        //      Levels[3] = Count at Level 3A
        //      Levels[4] = Count at Level 4S
        levels() {
            let levels = [];
            let max_level = 0;
            let total_words = 0;
            let total_words_with_level = 0;

            this.forEachWord((word, index) => {
                let level_num = this.levelOf(word);
                if(level_num >= 0) {
                    if(typeof levels[level_num] == "undefined") {
                        levels[level_num] = 0;
                    }
                    max_level = (level_num > max_level ? level_num : max_level);
                    levels[level_num]++;
                    total_words_with_level++;
                }
                total_words++;
            });

            // ensure values up to max level are zeroed out for convenience
            for(let i = 0; i < max_level; i++) {
                if(typeof levels[i] == "undefined") {
                    levels[i] = 0;
                }
            }

            // level zero doesn't exist, so use this to report any words that could not be assigned a level
            levels[0] = total_words - total_words_with_level;

            return levels;
        }

        // returns an integer between 0-100 representing the precentage of words at the target level
        readability(target_level) {
            if(typeof target_level == "undefined" || target_level < 1 || target_level > 4) {
                target_level = 1;
            }

            let words_at_or_below_level = 0;
            let words_above_level = 0;
            let levels = this.levels();

            for(let i = 0; i < levels.length; i++) {
                // TODO: how should we handle unparsed words (e.g. level 0)?
                if(i <= target_level) {
                    words_at_or_below_level += levels[i];
                } else {
                    words_above_level += levels[i];
                }
            }

            let score = Math.round(words_at_or_below_level / (words_at_or_below_level + words_above_level) * 100);
            return score;
        }
    }


    class LemmatizedTextCompare {
        constructor(text_a, text_b) {
            this.text_a = text_a;
            this.text_b = text_b;
        }

        // Returns a dict showing for each word in TextA, whether it has a lemma also appearing in TextB.
        intersect_lemmas() {
            let intersect = {};
            let text_a_vocab = this.text_a.vocab();
            let text_b_lemmas = this.text_b.lemmas();

            text_a_vocab.forEach((word_a) => {
                if(!intersect.hasOwnProperty(word_a)) {
                    intersect[word_a] = {word: word_a, intersects: false, lemma: false, lemmas: []};
                }

                let text_a_lemmas = this.text_a.lemmasOf(word_a);

                // no lemmas were found for word A, so we can't compare it to lemmas in text B
                if(text_a_lemmas.length == 0) {
                    return;
                } else if(text_a_lemmas.length > 1) {
                    // when there are multiple lemmas for a word, we can filter if the lemma matches the word form precisely,
                    // otherwise it's ambiguous which lemma to use, so we just keep all of them.
                    let matching_lemmas = [];
                    for(let i = 0; i < text_a_lemmas.length; i++) {
                        if(word_a.localeCompare(text_a_lemmas[i].label, LOCALE_NAME, LOCALE_COMPARE)) {
                            matching_lemmas.push(text_a_lemmas[i]);
                        }
                    }
                    if(matching_lemmas.length > 0) {
                        text_a_lemmas = matching_lemmas;
                    }
                }

                // iterate over TextA lemmas
                for(let i = 0, len_a = text_a_lemmas.length; i < len_a; i++) {
                    let lemma_a = text_a_lemmas[i].label;

                    // iterate over TextB lemmas and match
                    for(let j = 0, len_b = text_b_lemmas.length; j < len_b; j++) {
                        let lemma_b = text_b_lemmas[j];
                        if(lemma_a == lemma_b) {
                            intersect[word_a].intersects = true;
                            intersect[word_a].lemma = true;
                            intersect[word_a].lemmas.push(lemma_a);
                        }
                    }
                }
            });

            return intersect;
        }

        // Returns a dict showing for each vocab word in TextA, its count in TextB.
        intersect_vocab() {
            let intersect = {};
            let text_a_vocab = this.text_a.vocab();
            let text_b_vocab = this.text_b.vocab();

            text_a_vocab.forEach((word_a) => {
                if(!intersect.hasOwnProperty(word_a)) {
                    intersect[word_a] = 0;
                }
                for(let i = 0, len = text_b_vocab.length; i < len; i++) {
                    let word_b = text_b_vocab[i];
                    if(word_b.localeCompare(word_a, LOCALE_NAME, LOCALE_COMPARE) == 0) {
                        intersect[word_a]++;
                    }
                }
            });

            let intersect_vocab = {};
            for(let vocab in intersect) {
                if(intersect.hasOwnProperty(vocab)) {
                    intersect_vocab[vocab] = {word: vocab, intersects: intersect[vocab], lemma: false};
                }
            }

            return intersect_vocab;
        }

        // Returns list of all lemmas/vocab in TextA and whether they are in TextB or not.
        compare() {
            let intersect = this.intersect_lemmas();
            let intersect_vocab = this.intersect_vocab();

            for(let w in intersect_vocab) {
                if(!intersect.hasOwnProperty(w)) {
                    intersect[w] = {word: w, intersects: false, lemma: false};
                }
                if(intersect_vocab.hasOwnProperty(w)) {
                    intersect[w].intersects = intersect[w].intersects || intersect_vocab[w].intersects;
                }
            }

            let results = Object.keys(intersect)
                .map((w) => intersect[w])
                .sort((a,b) => {
                    if(a.intersects && b.intersects) {
                        return a.word - b.word;
                    } else if(a.intersects && !b.intersects) {
                        return -1;
                    } else if(!a.intersects && b.intersects) {
                        return 1;
                    } else {
                        return a.word - b.word;
                    }
                });
            return results;
        }
    }

    // Exports
    global.app = global.app || {};
    global.app.LemmatizedText = LemmatizedText;
    global.app.LemmatizedTextCompare = LemmatizedTextCompare;
})(window);
