(function(global, $) {
    "use strict";

    // Imports
    const LemmatizedText = global.app.LemmatizedText;
    const LemmatizedTextCompare = global.app.LemmatizedTextCompare;

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
            this.colorize = false;
        }

        onUpdate(e) {
            const vocab_value = document.getElementById("ministoryvocab").value.trim();
            const story_value = document.getElementById("ministorytext").value.trim();
            
            let p1 = this._updateVocab(vocab_value);
            let p2 = this._updateStory(story_value);

            this.executeLongRunningProcess(() => {
                return Promise.all([p1,p2]).then(() => this._update());
            });
            
        }

        executeLongRunningProcess(fn) {
            $("#processing_indicator").show();
            fn.apply(this, arguments).then(() => $("#processing_indicator").hide());
        }

        _update() {
            // Describe story vocabulary and lemmas 
            let story_vocab_stats = this.story_text.vocab_stats();
            let story_vocab_stats_html = story_vocab_stats
                .map((item, idx) => `<li class="wordlevel${this.colorize ? this.story_text.levelOf(item.word) : 0}">${item.word} - ${item.count}</li>`)
                .join("");

            let story_lemma_stats = this.story_text.lemma_stats();
            let story_lemma_stats_html = story_lemma_stats
                .map((item, idx) => `<li class="wordlevel${this.colorize ? this.story_text.levelOf(item.word) : 0}">${item.word} - ${item.count}</li>`)
                .join("");

            // Compare target vocabulary and lemmas against the story
            let text_compare = new LemmatizedTextCompare(this.vocab_text, this.story_text);
            let vocab_lemmas_intersect = text_compare.intersect_lemmas();
            let vocab_words_intersect = text_compare.intersect_vocab();

            let vocab_lemmas_intersect_list = Object.keys(vocab_lemmas_intersect)
                .map((w) => ({word: w, count: vocab_lemmas_intersect[w]}))
                .sort((a,b) => b.count - a.count);
            let vocab_lemmas_intersect_list_html = vocab_lemmas_intersect_list
                .map((item, idx) => `<li class="wordlevel${this.colorize ? this.vocab_text.levelOf(item.word) : 0}">${item.word} - ${item.count}</li>`)
                .join("");

            let vocab_words_intersect_list = Object.keys(vocab_words_intersect)
                .map((w) => ({word: w, count: vocab_words_intersect[w]}))
                .sort((a,b) => b.count - a.count);
            let vocab_words_intersect_list_html = vocab_words_intersect_list
                .map((item, idx) => `<li class="wordlevel${this.colorize ? this.vocab_text.levelOf(item.word) : 0}">${item.word} - ${item.count}</li>`)
                .join("");

            // Display results 
            $("#story_words").html(`<h5>Story words (${story_vocab_stats.length}):</h5><ul>${story_vocab_stats_html}</ul>`);
            $("#story_lemmas").html(`<h5>Story lemmas (${story_lemma_stats.length}):</h5><ul>${story_lemma_stats_html}</ul>`);
            $("#vocab_words").html(`<h5>Vocabulary words (${vocab_words_intersect_list.length}):</h5><ul>${vocab_words_intersect_list_html}</ul>`);
            $("#vocab_lemmas").html(`<h5>Vocabulary lemmas (${vocab_lemmas_intersect_list.length}):</h5><ul>${vocab_lemmas_intersect_list_html}</ul>`);
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
            ctrl.colorize = $('#colorizeoutput')[0].checked;
            ctrl.onUpdate(e);
        };
        //$(document).on('keyup', '#ministorytext,#ministoryvocab,#checkstory',  debounce(onUpdate, 500));
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

})(window, jQuery);