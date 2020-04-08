(function() {
    "use strict";

    // Imports
    const ApiClient = window.app.ApiClient;
    const LemmatizedText = window.app.LemmatizedText;
    const LemmatizedTextCompare = window.app.LemmatizedTextCompare;
    const sorttable = window.sorttable; // sorttable.js library (https://kryogenix.org/code/browser/sorttable/)

    class MiniStoryController {
        constructor() {
            this.vocab_value = ""; // Raw string
            this.vocab_text = null; // Holds instance of LemmatizedText
            this.story_value = ""; // Raw string
            this.story_text = null; // Holds instance of LemmatizedText
            this.option_colorize = false; // Optionally display words in the color dictated by the "level" of the lemma
            this.option_wordlist= false; // Optionally display a vocabulary word list 

            this.onCheckStory = this.onCheckStory.bind(this);
            this.onPasteMakePlainText = this.onPasteMakePlainText.bind(this);
        }

        // Event handler that calls the update() method
        onCheckStory(e) {
            if (event.target.id != "storyupdatebtn") return;
            try {
                this.update();
            } catch(e) {
                console.error(e);
                alert("Error: "+String(e));
            }
        }

        // Event handler that pastes formatted text as plain text
        onPasteMakePlainText(e) {
            if (event.target.id != "storytext_input") return;
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
            document.addEventListener('click', this.onCheckStory, false);
            document.addEventListener('paste', this.onPasteMakePlainText, false);
        }

        // Displays an error message
        error(err) {
            console.error(err);
            let el = document.getElementById("storyerror");
            el.style.display = "";
            el.innerHTML = "An error occurred. Particulars: "+String(e);
        }

        // Handles updating the view after pulling any changes from the inputs
        update() {
            // set options immediately that might affect rendering
            this.option_wordlist = document.getElementById('option_wordlist').checked;
            this.option_colorize = document.getElementById('option_colorize').checked;
            
            // update and render async, since the update may require a roundtrip to the server
            return this._asyncTask(() => {
                let p1 = this._updateVocab(document.getElementById("storyvocab_input").value.trim());
                let p2 = this._updateStory(document.getElementById("storytext_input").innerText.trim());
                return Promise.all([p1,p2]).then(() => this.render());
            });
        }

        // Renders the view
        render() {
            let views = [
                new MiniStoryEditorView({
                    story_text: this.story_text,
                    vocab_text: this.vocab_text,
                    colorize: this.option_colorize
                }),
                new MiniStoryLemmasView({
                    story_text: this.story_text,
                    colorize: this.option_colorize
                }),
                new MiniStoryVocabUsageView({
                    story_text: this.story_text,
                    vocab_text: this.vocab_text,
                    colorize: this.option_colorize
                }),
                new MiniStoryUniqueWordsView({ 
                    story_text: this.story_text,
                    visible: this.option_wordlist,
                    colorize: this.option_colorize
                })
            ];
            views.forEach((view) => view.render());
            return this;
        }

        // Executes a function that returns a promise, taking care to show the loading indicator 
        // and report any errors.
        _asyncTask(fn) {
            let before_task = () => {
                document.getElementById("storyerror").style.display = "none";
                document.getElementById("processing_indicator").style.display = "";
            };
            let after_task = () => {
                document.getElementById("storyerror").style.display = "none";
                document.getElementById("processing_indicator").style.display = "none";
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
            return LemmatizedText.asyncFromString({ api: new ApiClient(), text: vocab_value}).then((vocab_text) => {
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
            return LemmatizedText.asyncFromString({ api: new ApiClient(), text: story_value}).then((story_text) => {
                this.story_text = story_text;
                return this.story_text;
            });
        }

        // Generates a story and vocabulary for demo purposes
        static demo() {
            const story = `Мы ждали на автобусном остановке. Мы здесь ждем каждый день, потому что мы ездим на работу на автобусе. Вчера я был на работе, а Лена была дома. Я работал весь день, потом поехал домой. Я всегда езжу на автобусе. Лена иногда ходит пешком на работу или ездит на велосипеде.`;
            const vocab = `ждать ездить быть потом работа пешком`;
    
            document.getElementById("storytext_input").innerText = story.trim();
            document.getElementById("storyvocab_input").value = vocab.trim().split(" ").join("\n");
        }
    }


    class MiniStoryEditorView {
        constructor({ story_text, vocab_text, colorize }) {
            this.selector = "#storytext_input";
            this.story_text = story_text;
            this.vocab_text = vocab_text;
            this.colorize = colorize;
        }
        // Shows the input text with target vocabulary emphasized based on lemma
        render() {
            const token2html = (token, tokentype, index) => {
                let output = token;
                if(tokentype == "RUS") {
                    let level = this.story_text.levelOf(token);
                    let words = this.story_text.lemmasOf(token).map((word) => word.label);
                    let found = this.vocab_text.containsLemmas(words);
                    if(this.colorize) {
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
            };

            let html = this.story_text.mapTokens(token2html).join("");

            document.querySelector(this.selector).innerHTML = html;
        }
    }


    class MiniStoryLemmasView {
        constructor({ story_text, colorize }) {
            this.selector = "#storytext_lemmatized";
            this.story_text = story_text;
            this.colorize = colorize;
        }
        // Shows list of lemmas used in the story along with the specific forms associated with each
        render() {
            let story_lemma_stats = this.story_text.lemma_stats();

            let story_lemma_stats_html = story_lemma_stats.map((item, idx) => {
                const level = this.story_text.levelOf(item.word);
                const words = Object.keys(item.words).map(w => {
                    if(item.words[w] > 1) {
                        return w + `(×${item.words[w]})`;
                    }
                    return w;
                }).join(", ");
                return `<tr class="wordlevel${this.colorize ? level : 0}"><td>${item.word}</td><td>${words}</td><td>${item.count}</td><td>${level}</td></tr>`
            }).join("");

            document.querySelector(this.selector).innerHTML = `
                <h5>Story lemmas (${story_lemma_stats.length}):</h5>
                <div class="table-responsive">
                <table class="sortable table table-sm">
                    <thead class="thead-light"><tr><th>Lemma</th><th>Forms <small>(in order of appearance)</small></th><th>Count</th><th>Level</th></tr></thead>
                    ${story_lemma_stats_html}
                </table>
                </div>`;

            if(story_lemma_stats.length > 0) {
                sorttable.makeSortable(document.querySelector(this.selector + " table"));
            }
        }
    }


    class MiniStoryVocabUsageView {
        constructor({ story_text, vocab_text, colorize }) {
            this.selector = "#storyvocab_lemmatized";
            this.story_text = story_text;
            this.vocab_text = vocab_text;
            this.colorize = colorize;
        }
        // Compares target vocabulary lemmas against lemmas used in the text 
        render() {
            debugger;
            let lemmatized_text_compare = new LemmatizedTextCompare(this.vocab_text, this.story_text);
            let vocab_lemmas = lemmatized_text_compare.compare();
            
            let html = vocab_lemmas.map((item, idx) => {
                const level = this.vocab_text.levelOf(item.word);
                return `<tr class="wordlevel${this.colorize ? level : 0}"><td>${item.word}</td><td>${item.intersects?"&#x2705;":"&#x274C;"}</td><td>${item.lemmas.join(", ")}</td></tr>`
            }).join("");

            document.querySelector(this.selector).innerHTML = `
                <h5>Vocabulary usage (${vocab_lemmas.length}):</h5>
                <div class="table-responsive">
                <table class="sortable table table-sm">
                    <thead class="thead-light"><tr><th>Word</th><th>Used?</th><th>Matching Lemma(s)</th></tr></thead>
                    ${html}
                </table>
            `;
            
            if(vocab_lemmas.length > 0) {
                sorttable.makeSortable(document.querySelector(this.selector + " table"));
            }
        }
    }


    class MiniStoryUniqueWordsView {
        constructor({ story_text, visible, colorize }) {
            this.selector = "#storytext_vocab";
            this.visible = visible;
            this.story_text = story_text;
            this.colorize = colorize;
        }
        // Shows a list of unique vocabulary words used in the text
        // Note that this is optional and not displayed by default since it's less useful than the list of lemmas.
        render() {
            let containerEl = document.querySelector(this.selector)
            containerEl.style.display = (this.visible ? "" : "none");
            if(!this.visible) {
                return;
            }

            let story_vocab_stats = this.story_text.vocab_stats();

            let story_vocab_stats_html = story_vocab_stats.map((item, idx) => {
                const level = this.story_text.levelOf(item.word);
                return `<tr class="wordlevel${this.colorize ? level : 0}"><td>${item.word}</td><td>${item.count}</td><td>${level}</td></tr>`
            }).join("");
            
            containerEl.innerHTML = `
                <h5>Story words (${story_vocab_stats.length}):</h5>
                <div class="table-responsive">
                <table class="table table-sm">
                    <thead class="thead-light"><tr><th>Word</th><th>Count</th><th>Level</th></tr></thead>
                    ${story_vocab_stats_html}
                </table>
                </div>`;

            if(story_vocab_stats.length > 0) {
                sorttable.makeSortable(document.querySelector(this.selector + " table"));
            }
        }
    }

    // To run a demo, type demo() in your javascript console....
    window.demo = MiniStoryController.demo;

    window.addEventListener('DOMContentLoaded', (event) => {
        console.log('DOM fully loaded and parsed');
        const ctrl = new MiniStoryController();
        ctrl.listen();

        if(window.location.hash == "#demo") {
            window.demo();
        }
    });

})();