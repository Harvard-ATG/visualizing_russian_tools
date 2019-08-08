(function($) {
    "use strict";

    const ApiClient = window.VZR.ApiClient;

    const unique = (arr) => {
        let seen = {}, items = [];
        for(var i = 0; i < arr.length; i++) {
            if(!seen.hasOwnProperty(arr[i])) {
                seen[arr[i]] = true;
                items.push(arr[i]);
            }
        }
        return items;
    }

    const debounce = (fn, time) => {
        let timeout;
        return function() {
          const functionCall = () => fn.apply(this, arguments);
          clearTimeout(timeout);
          timeout = setTimeout(functionCall, time);
        }
    }

    class LemmatizedText {
        
        constructor(data) {
            data = data || {tokens: [], forms: {}, lemmas: {}};
            this._tokens = data.tokens;
            this._lemmas = data.lemmas;
            this._forms = data.forms;
            this._cache_forms_of = {}
            this._cache_lemmas_of = {};
        }

        // returns a promise with an instance of a lemmatized text
        static asyncFromString(text) {
            text = text.trim();
            if(!text) {
                return Promise.resolve(new LemmatizedText());
            }
            let api = new ApiClient();
            return api.lemmatizetext(text).then((res) => {
                return new LemmatizedText(res.data);
            });
        }

        // returns a copy of the individual tokens from the lemmatized text
        tokens() {
            return this._tokens.slice(0);
        }

        // returns the words
        words() {
            return this._tokens.filter(o => o.tokentype == "RUS").map(o => o.token);
        }

        // returns the set of lemmas or headwords in the text
        lemmas() {
            let lemmas = Object.values(this._lemmas).map(o => o.label);
            lemmas.sort((a, b) => a.localeCompare(b), "ru-RU", {sensitivity: "base", ignorePunctuation: true});
            return lemmas;
        } 

        // returns the set of unique words in the text
        vocab() {
            let compare_options = {sensitivity: "base", ignorePunctuation: true};
            let vocab = unique(this.words()).sort((a, b) => a.localeCompare(b), "ru-RU", compare_options);
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
            for(let i = 0; i < _tokens.length; i++) {
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
            options.sort = options.sort || "rank";

            const compare = {
                level: (a, b) => parseInt(a.level) - parseInt(b.level),
                rank: (a, b) => a.rank - b.rank
            };
            const compareFn = compare[options.sort];
            
            if(this._cache_lemmas_of[word]) {
                let word_lemmas = this._cache_lemmas_of[word];
                return word_lemmas.sort(compareFn);
            } 

           let seen = {};
           let word_lemmas = [];
           let word_forms = this.formsOf(word);
           
           for(let i = 0; i < word_forms.length; i++) {
                let lemma_id = word_forms[i].lemma_id;
                let lemma_obj = this._lemmas[lemma_id];
                if(!seen.hasOwnProperty(lemma_id)) {
                    word_lemmas.push(lemma_obj);
                    seen[lemma_id] = true;
                }
           }

           this._cache_lemmas_of[word] = word_lemmas;

           return word_lemmas.sort(compareFn);
        }

        // lookup the forms of a word that matched in the text
        formsOf(word) {
            if(this._cache_forms_of[word]) {
                return this._cache_forms_of[word];
            }

            let word_forms = [];
            let _forms = Object.values(this._forms);

            for(let i = 0; i < _forms.length; i++) {
                let form_obj = _forms[i];
                if(form_obj.label.localeCompare(word, "ru-RU", {sensitivity: "base", ignorePunctuation: true}) == 0) {
                    word_forms.push(form_obj);
                }
            }

            this._cache_forms_of[word] = word_forms;

            return word_forms;
        }

        vocab_stats() {
            let counter = {};
            this.forEachWord((word) => {
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

        lemma_stats() {
            let counter = {};
            this.forEachWord((word) => {
                let lemma_records = this.lemmasOf(word);
                let lemma = (lemma_records.length > 0 ? lemma_records[0] : false);
                if(lemma) {
                    if(!counter.hasOwnProperty(lemma.label)) {
                        counter[lemma.label] = 0;
                    }
                    counter[lemma.label]++
                }
            });

            let stats = Object.keys(counter)
                .map((w) => ({word: w, count: counter[w]}))
                .sort((a, b) => b.count - a.count);

            return stats;
        }

        // returns the number of times the word appears
        count(word) {
            let count = 0;
            this.forEachWord((iter_word) => {
                if(iter_word.localeCompare(word, "ru-RU", {sensitivity: "base"}) == 0) {
                    count++;
                }
            });
            return count;
        } 

        // returns the lowest level associated with the word or -1 if no level could be assigned
        levelOf(word) {
            let lemma_records = this.lemmasOf(word, {sort: "level"});
            let lemma = (lemma_records.length > 0 ? lemma_records[0] : false);
            if(lemma) {
                let level_num = parseInt(lemma.level);
                return level_num;
            }
            return -1;
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

        verbs() {} // produce a list of the verbs
        verb_aspectual_pair(verb) {} // produce the aspectual pair for a given verb
        nouns() {} // produce a list of the nouns
        pronouns() {} // produce a list of the pronouns
        adjectives() {} // produce a list of the adjectives
        adverbs() {} // produce a list of the adverbs
        numerals() {} // produce a list of the numerals 
    }


    class MiniStoryController {
        constructor() {
            this.vocab_value = "";
            this.story_value = "";
        }

        onUpdate(e) {
            const vocab_value = document.getElementById("ministoryvocab").value.trim();
            const story_value = document.getElementById("ministorytext").value.trim();
            let p1 = this._updateVocab(vocab_value);
            let p2 = this._updateStory(story_value);
            Promise.all([p1,p2]).then(() => this._update());
        }

        _update() {
            // Check how target vocabulary is represented in the story
            let vocab_lemma_usage = {};
            let vocab_word_usage = {};
            let story_words = this.story_text.words();
            let story_lemmas = this.story_text.lemmas();

            console.log("levels", this.story_text.levels());
            console.log("readability", this.story_text.readability());

            this.vocab_text.vocab().forEach((vocab_word) => {
                if(!vocab_word_usage.hasOwnProperty(vocab_word)) {
                    vocab_word_usage[vocab_word] = 0;
                }
                for(let i = 0; i < story_words.length; i++) {
                    if(story_words[i].localeCompare(vocab_word, "ru-RU", {sensitivity: "base"}) == 0) {
                        vocab_word_usage[vocab_word]++;
                    }
                }

                let vocab_word_lemma_records = this.vocab_text.lemmasOf(vocab_word);
                for(let i = 0; i < vocab_word_lemma_records.length; i++) {
                    let vocab_word_lemma = vocab_word_lemma_records[i].label;
                    if(!vocab_lemma_usage.hasOwnProperty(vocab_word_lemma)) {
                        vocab_lemma_usage[vocab_word_lemma] = 0;
                    }
                    for(let j = 0; j < story_lemmas.length; j++) {
                        if(story_lemmas[j] == vocab_word_lemma) {
                            vocab_lemma_usage[vocab_word_lemma]++;
                        }
                    }
                }
            });

            let vocab_lemma_usage_list = Object.keys(vocab_lemma_usage).map((w) => {
                return {word: w, count: vocab_lemma_usage[w]};
            });
            vocab_lemma_usage_list.sort((a,b) => b.count - a.count);
            let vocab_lemma_usage_list_html = vocab_lemma_usage_list.map((item, idx) => `<li>${item.word} - ${item.count}</li>`).join("");

            let vocab_word_usage_list = Object.keys(vocab_word_usage).map((w) => {
                return {word: w, count: vocab_word_usage[w]};
            });
            vocab_word_usage_list.sort((a,b) => b.count - a.count);
            let vocab_word_usage_list_html = vocab_word_usage_list.map((item, idx) => `<li>${item.word} - ${item.count}</li>`).join("");

            let story_lemma_stats = this.story_text.lemma_stats();
            let story_lemma_stats_html = story_lemma_stats.map((item, idx) => `<li>${item.word} - ${item.count}</li>`).join("");

            let story_vocab_stats = this.story_text.vocab_stats();
            let story_vocab_stats_html = story_vocab_stats.map((item, idx) => `<li>${item.word} - ${item.count}</li>`).join("");

            $("#story_words").html("").html(`<p>Story words (${story_vocab_stats.length}):</p><ul>${story_vocab_stats_html}</ul>`);
            $("#story_lemmas").html("").html(`<p>Story lemmas (${story_lemma_stats.length}):</p><ul>${story_lemma_stats_html}</ul>`);
            $("#vocab_words").html("").html(`<p>Vocabulary words (${vocab_word_usage_list.length}):</p><ul>${vocab_word_usage_list_html}</ul>`);
            $("#vocab_lemmas").html("").html(`<p>Vocabulary lemmas (${vocab_lemma_usage_list.length}):</p><ul>${vocab_lemma_usage_list_html}</ul>`);
        }

        _updateVocab(vocab_value) {
            this.vocab_value = vocab_value;
            return LemmatizedText.asyncFromString(vocab_value).then((vocab_text) => {
                this.vocab_text = vocab_text;
            });
        }
        _updateStory(story_value) {
            this.story_value = story_value;
            return LemmatizedText.asyncFromString(story_value).then((story_text) => {
                this.story_text = story_text;
            });
        }
    }

    $(document).ready(function() {
        const ctrl = new MiniStoryController();
        const onUpdate = ctrl.onUpdate.bind(ctrl);
        const onUpdateDebounced = debounce(onUpdate, 500);
        $(document).on('keyup', '#ministorytext,#ministoryvocab,#checkstory',  onUpdateDebounced);
        $(document).on('click', '#checkstory', onUpdate);
        
        //generate_test_story_and_vocab();
    });

    function generate_test_story_and_vocab() {
        const story = `
Все смешалось в доме Облонских. Жена узнала, что муж был в связи с бывшею в их доме француженкою-гувернанткой, и объявила мужу, что не может жить с ним в одном доме. Положение это продолжалось уже третий день и мучительно чувствовалось и самими супругами, и всеми членами семьи, и домочадцами. Все члены семьи и домочадцы чувствовали, что нет смысла в их сожительстве и что на каждом постоялом дворе случайно сошедшиеся люди более связаны между собой, чем они, члены семьи и домочадцы Облонских. Жена не выходила из своих комнат, мужа третий день не было дома. Дети бегали по всему дому, как потерянные; англичанка поссорилась с экономкой и написала записку приятельнице, прося приискать ей новое место; повар ушел вчера со двора, во время самого обеда; черная кухарка и кучер просили расчета.
На третий день после ссоры князь Степан Аркадьич Облонский — Стива, как его звали в свете, — в обычный час, то есть в восемь часов утра, проснулся не в спальне жены, а в своем кабинете, на сафьянном диване. Он повернул свое полное, выхоленное тело на пружинах дивана, как бы желая опять заснуть надолго, с другой стороны крепко обнял подушку и прижался к ней щекой; но вдруг вскочил, сел на диван и открыл глаза.
«Да, да, как это было? — думал он, вспоминая сон. — Да, как это было? Да! Алабин давал обед в Дармштадте; нет, не в Дармштадте, а что-то американское. Да, но там Дармштадт был в Америке. Да, Алабин давал обед на стеклянных столах, да, — и столы пели: Il mio tesoro 1 и не Il mio tesoro, а что-то лучше, и какие-то маленькие графинчики, и они же женщины», — вспоминал он.
`;
        const vocab = `
американское
Да
но
Дармштадте
члены
его
`;

    document.getElementById("ministorytext").value = story.trim();
    document.getElementById("ministoryvocab").value = vocab.trim();
    }

})(jQuery);