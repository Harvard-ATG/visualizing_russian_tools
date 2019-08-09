(function(global, $) {
    "use strict";

    // Imports
    const LemmatizedText = global.app.LemmatizedText;
    const LemmatizedTextCompare = global.app.LemmatizedTextCompare;
    const sorttable = global.sorttable; // sorttable.js library (https://kryogenix.org/code/browser/sorttable/)

    const debounce = (fn, time) => {
        let timeout;
        return function() {
          const functionCall = () => fn.apply(this, arguments);
          clearTimeout(timeout);
          timeout = setTimeout(functionCall, time);
        }
    }


    class MiniStoryController {
        constructor() {
            this.vocab_value = "";
            this.story_value = "";
            this.showlevels = false;
            this.showstorywords = false;
        }

        onUpdate(e) {
            const vocab_value = document.getElementById("ministoryvocab").value.trim();
            const story_value = document.getElementById("ministorytext").value.trim();
            
            this.executeTask(() => {
                let p1 = this._updateVocab(vocab_value);
                let p2 = this._updateStory(story_value);
                return Promise.all([p1,p2]).then(() => this.render());
            });
        }

        executeTask(fn) {
            $("#processing_indicator").show();
            let promise = fn.apply(this, arguments);
            promise.then(() => $("#processing_indicator").hide());
            return promise;
        }

        render() {
            this._renderStoryWords();
            this._renderStoryLemmas();
            this._renderTargetLemmas();
        }

        _renderStoryWords() {
            // Show list of story words if it's enabled
            if(!this.showstorywords) {
                return $("#story_words").hide();
            }

            let story_vocab_stats = this.story_text.vocab_stats();
            let story_vocab_stats_html = story_vocab_stats
                .map((item, idx) => `<tr class="wordlevel${this.showlevels ? this.story_text.levelOf(item.word) : 0}"><td>${item.word}</td><td>${item.count}</td></tr>`)
                .join("");

            $("#story_words").show().html(`
                <h5>Story words (${story_vocab_stats.length}):</h5>
                <table class="table">
                    <thead><tr><th>Word</th><th>Count</th></tr></thead>
                    ${story_vocab_stats_html}
                </table>`);
            sorttable.makeSortable(document.querySelector("#story_words table"));
        }

        _renderStoryLemmas() {
            // Collect story lemma statistics
            let story_lemma_stats = this.story_text.lemma_stats();
            let story_lemma_stats_html = story_lemma_stats.map((item, idx) => {
                let words = Object.keys(item.words).map(w => {
                    if(item.words[w] > 1) {
                        return w + `(×${item.words[w]})`;
                    }
                    return w;
                }).join(", ");
                return `<tr class="wordlevel${this.showlevels ? this.story_text.levelOf(item.word) : 0}"><td>${item.word}</td><td>${words}</td><td>${item.count}</td></tr>`
            }).join("");

            $("#story_lemmas").html(`
                <h5>Story lemmas (${story_lemma_stats.length}):</h5>
                <table class="sortable table">
                    <thead><tr><th>Lemma</th><th>Forms <small>(in order of appearance)</small></th><th>Count</th></tr></thead>
                    ${story_lemma_stats_html}
                </table>`);
                sorttable.makeSortable(document.querySelector("#story_lemmas table"));
        }

        _renderTargetLemmas() {
            // Compare target vocabulary against the story
            let text_compare = new LemmatizedTextCompare(this.vocab_text, this.story_text);
            let vocab_lemmas_intersect = text_compare.compare_lemmas();
            let vocab_lemmas_intersect_list = Object.keys(vocab_lemmas_intersect)
                .map((w) => ({word: w, intersects: vocab_lemmas_intersect[w]}))
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
            let vocab_lemmas_intersect_list_html = vocab_lemmas_intersect_list
                .map((item, idx) => `<tr class="wordlevel${this.showlevels ? this.vocab_text.levelOf(item.word) : 0}"><td>${item.word}</td><td>${item.intersects?"&#x2705;":"&#x274C;"}</td></tr>`)
                .join("");
            
            $("#target_lemmas").html(`
                <h5>Target lemmas (${vocab_lemmas_intersect_list.length}):</h5>
                <table class="sortable table">
                    <thead><tr><th>Word</th><th>Used in story?</th></tr></thead>
                    ${vocab_lemmas_intersect_list_html}
                </table>`);
            sorttable.makeSortable(document.querySelector("#target_lemmas table"));
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
        const onUpdate = (e) => {
            ctrl.showstorywords = $('#showstorywords')[0].checked;
            ctrl.showlevels = $('#showlevels')[0].checked;
            ctrl.onUpdate(e);
        };
        //$(document).on('keyup', '#ministorytext,#ministoryvocab,#checkstory',  debounce(onUpdate, 500));
        $(document).on('click', '#checkstory', onUpdate);
        
        generate_placeholder_values();
    });

    function generate_placeholder_values() {
        const story = `
Мы ждали на автобусном остановке. Мы здесь ждем каждый день, потому что мы ездим на работу на автобусе. Вчера я был на работе, а Лена была дома. Я работал весь день, потом поехал домой. Я всегда езжу на автобусе. Лена иногда ходит пешком на работу или ездит на велосипеде. 
`;

        const vocab = `
ждать
ездить
быть
потом
работа
пешком
`;

    document.getElementById("ministorytext").value = story.trim();
    document.getElementById("ministoryvocab").value = vocab.trim();
    }

})(window, jQuery);