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
            this.vocab_value = ""; // Raw string
            this.story_value = ""; // Raw string
            this.story_text = null; // Holds instance of LemmatizedText
            this.story_vocab = null; // Holds instance of LemmatizedText
            this.option_levels = false; // Optionally display words in the color dictated by the "level" of the lemma
            this.option_wordlist = false; // Optionally display a vocabulary word list 

            this.onCheckStory = this.onCheckStory.bind(this);
            this.onPasteMakePlainText = this.onPasteMakePlainText.bind(this);
        }

        // Event handler that calls the update() method
        onCheckStory(e) {
            try {
                this.update();
            } catch(e) {
                console.error(e);
                alert("Error: "+String(e));
            }
        }

        // Event handler that pastes formatted text as plain text
        onPasteMakePlainText(e) {
            e.preventDefault();
            var text = '';
            if (e.clipboardData || e.originalEvent.clipboardData) {
              text = (e.originalEvent || e).clipboardData.getData('text/plain');
            } else if (window.clipboardData) {
              text = window.clipboardData.getData('Text');
            }
            if (document.queryCommandSupported('insertText')) {
              document.execCommand('insertText', false, text);
            } else {
              document.execCommand('paste', false, text);
            }
        }

        // Setup listeners on the page to react to events
        listen() {
            $(document).on('click', '#storyupdatebtn', this.onCheckStory);
            $(document).on('paste', "#storytext", this.onPasteMakePlainText);
        }

        // Displays an error message
        error(err) {
            console.error(err);
            $("#storyerror").show().html("An error occurred. Particulars: "+String(e));
        }

        // Handles updating the view after pulling any changes from the inputs
        update() {
            // set options immediately that might affect rendering
            this.option_wordlist = document.getElementById('option_wordlist').checked;
            this.option_levels = document.getElementById('option_levels').checked;
            
            // update and render async, since the update may require a roundtrip to the server
            return this._asyncTask(() => {
                let p1 = this._updateVocab(document.getElementById("storyvocab").value.trim());
                let p2 = this._updateStory(document.getElementById("storytext").innerText.trim());
                return Promise.all([p1,p2]).then(() => this.render());
            });
        }

        // Renders the view
        render() {
            this._renderStoryWords();
            this._renderStoryLemmas();
            this._renderTargetLemmas();
            this._renderStoryTextEditor();
            return this;
        }

        // Shows a list of unique vocabulary words used in the text
        // Note that this is optional and not displayed by default since it's less useful than the list of lemmas.
        _renderStoryWords() {
            $("#story_words")[this.option_wordlist?"show":"hide"]();
            if(!this.option_wordlist) {
                return;
            }

            let story_vocab_stats = this.story_text.vocab_stats();
            let story_vocab_stats_html = story_vocab_stats
                .map((item, idx) => `<tr class="wordlevel${this.option_levels ? this.story_text.levelOf(item.word) : 0}"><td>${item.word}</td><td>${item.count}</td></tr>`)
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

        // Shows list of lemmas used in the story along with the specific forms associated with each
        _renderStoryLemmas() {
            let story_lemma_stats = this.story_text.lemma_stats();

            let story_lemma_stats_html = story_lemma_stats.map((item, idx) => {
                let words = Object.keys(item.words).map(w => {
                    if(item.words[w] > 1) {
                        return w + `(×${item.words[w]})`;
                    }
                    return w;
                }).join(", ");
                return `<tr class="wordlevel${this.option_levels ? this.story_text.levelOf(item.word) : 0}"><td>${item.word}</td><td>${words}</td><td>${item.count}</td></tr>`
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

        // Compares target vocabulary lemmas against lemmas used in the text 
        _renderTargetLemmas() {
            let text_compare = new LemmatizedTextCompare(this.vocab_text, this.story_text);
            let vocab_lemmas = text_compare.leftjoin("lemmas");
            let vocab_lemmas_html = vocab_lemmas
                .map((item, idx) => `<tr class="wordlevel${this.option_levels ? this.vocab_text.levelOf(item.word) : 0}"><td>${item.word}</td><td>${item.intersects?"&#x2705;":"&#x274C;"}</td></tr>`)
                .join("");
            
            $("#target_lemmas").html(`
                <h5>Target lemmas (${vocab_lemmas.length}):</h5>
                <div class="table-responsive">
                <table class="sortable table table-sm">
                    <thead class="thead-light"><tr><th>Word</th><th>Used in story?</th></tr></thead>
                    ${vocab_lemmas_html}
                </table>
                </div>`);
            
            if(vocab_lemmas.length > 0) {
                sorttable.makeSortable(document.querySelector("#target_lemmas table"));
            }
        }

        // Shows the input text with target vocabulary emphasized based on lemma
        _renderStoryTextEditor() {
            let html = this.story_text.mapTokens((token, tokentype, index) => {
                let output = token;
                if(tokentype == "RUS") {
                    let level = this.story_text.levelOf(token);
                    let words = this.story_text.lemmasOf(token).map((word) => word.label);
                    let found = this.vocab_text.containsLemmas(words);
                    if(this.option_levels) {
                        if(found) {
                            output = `<b class="wordlevel${level}">${output}</b>`
                        } else {
                            output = `<span class="wordlevel${level}">${output}</span>`;
                        }
                    } else {
                        if(found) {
                            output = `<b>${token}</b>`;
                        } else {
                            output = token;
                        }
                    }
                } else {
                    output = output.replace(/\n/g, '<br>');
                }
                return output;
            }).join("");

            document.getElementById("storytext").innerHTML = html;
        }

        // Executes a function that returns a promise, taking care to show the loading indicator 
        // and report any errors.
        _asyncTask(fn) {
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
            promise.then(after_task).catch((err) => {
                after_task();
                return this.error(err);
            });
            return promise;
        }

        // Lemmatizes the vocabulary if it has changed
        _updateVocab(vocab_value) {
            if(this.vocab_value === vocab_value && this.vocab_text) {
                return Promise.resolve(this.vocab_text); 
            }
            this.vocab_value = vocab_value;
            return LemmatizedText.asyncFromString(vocab_value).then((vocab_text) => {
                this.vocab_text = vocab_text;
                return this.vocab_text;
            });
        }

        // Lemmatizes the story text if it has changed
        _updateStory(story_value) {
            if(this.story_value === story_value && this.story_text) {
                return Promise.resolve(this.story_text);
            }
            this.story_value = story_value;
            return LemmatizedText.asyncFromString(story_value).then((story_text) => {
                this.story_text = story_text;
                return this.story_text;
            });
        }

        // Generates a story and vocabulary for demo purposes
        static storydemo() {
            const story = `Мы ждали на автобусном остановке. Мы здесь ждем каждый день, потому что мы ездим на работу на автобусе. Вчера я был на работе, а Лена была дома. Я работал весь день, потом поехал домой. Я всегда езжу на автобусе. Лена иногда ходит пешком на работу или ездит на велосипеде.`;
            const vocab = `ждать ездить быть потом работа пешком`;
    
            $("#storytext")[0].innerText = story.trim();
            $("#storyvocab")[0].value = vocab.trim().split(" ").join("\n");
        }
    }

    $(document).ready(function() {
        const ctrl = new MiniStoryController();
        ctrl.listen();

        // allow global access to controller for debugging / demo purposes
        global.storyctrl = ctrl; 
        global.storydemo = MiniStoryController.storydemo;
    });

    

})(window, jQuery);