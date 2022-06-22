(function ($) {
    const { shuffle } = window.app.utils;

    function initialize() {
        const possible_words = JSON.parse(document.getElementById("possible_words_data").textContent);
        const generate_words_btn = document.querySelector("#generate-words");
        const words_textarea = document.querySelector("#id_words");
        const word_count = document.querySelector("#wordcount");

        // Generate a list of random words
        function generate_words(possible_words) {
            let shuffled_words = shuffle(possible_words);
            words_textarea.value = shuffled_words.slice(0, 57).join("\n");
        }

        // Updates the word count
        function update_word_count() {
            const lines = words_textarea.value.split(/\n+/g).filter((w) => w !== "");
            word_count.innerHTML = lines.length;
        }

        // Event handlers
        words_textarea.addEventListener("input", update_word_count);
        words_textarea.addEventListener("change", update_word_count);
        generate_words_btn.addEventListener("click", (e) => {
            e.preventDefault();
            generate_words(possible_words);
            update_word_count();
        });
    }

    $(document).ready(initialize);
})(jQuery);