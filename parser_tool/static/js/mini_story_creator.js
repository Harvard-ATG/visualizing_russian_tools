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
            this.showstorytext = false;
        }

        onError(e) {
            $("#ministoryerror").show().html("An error occurred. Particulars: "+String(e));
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
            let before_task = () => {
                $("#ministoryerror").hide();
                $("#processing_indicator").show();
            };
            let after_task = () => {
                $("#ministoryerror").hide();
                $("#processing_indicator").hide();
            };

            before_task();
            let promise = fn.apply(this, arguments);
            promise.then(after_task).catch((e) => {
                after_task();
                return this.onError(e)
            });

            return promise;
        }

        render() {
            this._renderStoryWords();
            this._renderStoryLemmas();
            this._renderTargetLemmas();
            this._renderStoryText();
        }

        _renderStoryWords() {
            // Show list of story words if it's enabled
            if(this.showstorywords) {
                $("#story_words").show();
            } else {
                $("#story_words").hide();
                return;
            }

            let story_vocab_stats = this.story_text.vocab_stats();
            let story_vocab_stats_html = story_vocab_stats
                .map((item, idx) => `<tr class="wordlevel${this.showlevels ? this.story_text.levelOf(item.word) : 0}"><td>${item.word}</td><td>${item.count}</td></tr>`)
                .join("");
            
            $("#story_words").html(`
                <h5>Story words (${story_vocab_stats.length}):</h5>
                <div class="table-responsive">
                <table class="table table-sm">
                    <thead class="thead-light"><tr><th>Word</th><th>Count</th></tr></thead>
                    ${story_vocab_stats_html}
                </table>
                </div>`);

            if(story_vocab_stats.length > 0) {
                sorttable.makeSortable(document.querySelector("#story_words table"));
            }
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
                <div class="table-responsive">
                <table class="sortable table table-sm">
                    <thead class="thead-light"><tr><th>Lemma</th><th>Forms <small>(in order of appearance)</small></th><th>Count</th></tr></thead>
                    ${story_lemma_stats_html}
                </table>
                </div>`);

            if(story_lemma_stats.length > 0) {
                sorttable.makeSortable(document.querySelector("#story_lemmas table"));
            }
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
                <div class="table-responsive">
                <table class="sortable table table-sm">
                    <thead class="thead-light"><tr><th>Word</th><th>Used in story?</th></tr></thead>
                    ${vocab_lemmas_intersect_list_html}
                </table>
                </div>`);
            
            if(vocab_lemmas_intersect_list.length > 0) {
                sorttable.makeSortable(document.querySelector("#target_lemmas table"));
            }
        }

        _renderStoryText() {
            if(!this.showstorytext) {
                return $("#story_text_output").hide();
            }

            let html = this.story_text.mapTokens((token, tokentype, index) => {
                let output = token;
                if(tokentype == "RUS") {
                    let level = this.story_text.levelOf(token);
                    let words = this.story_text.lemmasOf(token).map((word) => word.label);
                    let found = this.vocab_text.containsLemmas(words);
                    if(found) {
                        output = `<b>${token}</b>`;
                    }
                    if(this.showlevels) {
                        output = `<span class="wordlevel${level}">${output}</span>`;
                    }
                } else {
                    output = output.replace(/\n/g, '<br>');
                }
                return output;
            });
            $("#story_text_output").show().html(html);
        }

        _updateVocab(vocab_value) {
            if(this.vocab_value === vocab_value && this.vocab_text) {
                return Promise.resolve(); 
            }
            this.vocab_value = vocab_value;
            return LemmatizedText.asyncFromString(vocab_value).then((vocab_text) => {
                this.vocab_text = vocab_text;
            });
        }
        _updateStory(story_value) {
            if(this.story_value === story_value && this.story_text) {
                return Promise.resolve(); 
            }
            this.story_value = story_value;
            return LemmatizedText.asyncFromString(story_value).then((story_text) => {
                this.story_text = story_text;
            });
        }
    }

    $(document).ready(function() {
        const ctrl = new MiniStoryController();
        const onUpdate = (e) => {
            try {
                ctrl.showstorywords = $('#showstorywords')[0].checked;
                ctrl.showlevels = $('#showlevels')[0].checked;
                ctrl.showstorytext = $("#showstorytext")[0].checked;
                ctrl.onUpdate(e);
            } catch(e) {
                console.error(e);
                alert("Error: "+String(e));
            }
        };
        //$(document).on('keyup', '#ministorytext,#ministoryvocab,#checkstory,#showstorywords,#showlevels',  debounce(onUpdate, 500));
        $(document).on('click', '#checkstory', onUpdate);
    });

    function generate_test_story() {
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

    global.generate_test_story = generate_test_story;

})(window, jQuery);