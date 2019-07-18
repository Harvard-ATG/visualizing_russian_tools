(function($) {
    "use strict";

    var ApiClient = window.VZR.ApiClient;

    class MiniStoryController {
        constructor(raw_content, raw_vocab) {
            this.raw_content = raw_content;
            this.raw_vocab = raw_vocab;
            this.api = new ApiClient();
        }

        tokenize(content) {
            return this.api.tokenize(content); 
        }

        lemmatize(content) {
           return this.api.lemmatize(content);
        }

        checkstory() {
            var $results = $("#results");

            this.lemmatize(this.raw_content).then((res, textStatus, jqXhr) => {
                var model = new MiniStoryModel(res.data.tokens, res.data.forms, res.data.lemmas, this.raw_vocab);
                var vocab_results = model.check_vocab();
                console.log(vocab_results);

                var html_li = vocab_results.map((result, idx) => {
                    return `<li><b>${result.word}</b>: ${result.count}</li>`;
                }).join("");
                $results.html("").html(`<p>Vocabulary used in text:</p><ul>${html_li}</ul>`);
            });
        }
    }

    class MiniStoryModel {
        constructor(story_tokens, story_forms, story_lemmas, raw_vocab) {
            this.story_tokens = story_tokens;
            this.story_forms = story_forms;
            this.story_lemmas = story_lemmas;
            this.raw_vocab = raw_vocab;
        }

        check_vocab() {
            var token_count = this.get_token_counts();
            var vocab_list = this.get_vocab_list_sorted();
            var vocab_count = {};
            var results = [], i, word;

            // counts how many times each vocabulary word appears in the text
            for(i = 0; i < vocab_list.length; i++) {
                word = vocab_list[i];
                if(token_count.hasOwnProperty(word)) {
                    vocab_count[word] = token_count[word];
                } else {
                    vocab_count[word] = 0;
                }
                results.push({ "word": word, "count": vocab_count[word] })
            }

            results.sort((a, b) => {
                return a.count - b.count;
            });

            return results;
        }

        get_vocab_list_sorted() {
            var vocab_list = this.raw_vocab.split(/\n+/).map(function(s) { 
                return s.trim().toLowerCase();
            }).filter(function(s) {
                return s !== "";
            });
            vocab_list.sort();
            return vocab_list;
        }

        get_token_counts() {
            var tokens = this.story_tokens;
            var token_count = {};
            for(var i = 0, token; i < tokens.length; i++) {
                token = tokens[i].canonical;
                if(token_count.hasOwnProperty(token)) {
                    token_count[token]++;
                } else {
                    token_count[token] = 1;
                }
            }
            return token_count;
        }
    }

    function handleStoryChange(e) {
        var raw_content = document.getElementById("ministorytext").value;
        var raw_vocab = document.getElementById("ministoryvocab").value;
        var controller = new MiniStoryController(raw_content, raw_vocab);
        controller.checkstory();
    }

    $(document).ready(function() {
        $(document).on('change', '#ministorytext,#ministoryvocab', handleStoryChange );
    });

})(jQuery);