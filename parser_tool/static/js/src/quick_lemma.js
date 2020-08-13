(function($) {
  const ApiClient = window.app.ApiClient;
    // practice
    async function sorted_lemmas() {
      await display('lemma');
    }
    async function sorted_forms() {
      await display('form');
    }
    async function get_forms() {
      await display('lemma_to_forms');
    }

    async function display(designator) {
        const api = new ApiClient();
        var input_text = $("#contentinput").val();
        try {
          before_rank_lemmas();
          if ((designator == 'lemma') || (designator == 'form')) {
            const jqXhr = api.lemmatizetext(input_text); 
            jqXhr.then(function(result, textStatus) {
            var array = new_make_array(result, designator);
            after_rank_lemmas(array, designator);
            })
          };
          if (designator == 'lemma_to_forms') {
            const jqXhr = api.getforms(input_text); 
            jqXhr.then(function(result, textStatus) {
            var array = new_make_array(result, designator);
            after_rank_lemmas(array, designator);
            });
          }
        } catch(err) {
          error(err);
        }
      };

      function new_make_array(result, designator) {
        if (designator == 'lemma') {
          var values = Object.values(result.data.lemmas);
        }
        if (designator == 'form') {
          var values = Object.values(result.data.tokens);
        }
        if (designator == 'lemma_to_forms') {
          var values = Object.values(result.data);
        }
        var array = []
        let unique_words = new Set();
        for (const val of values) {
          if (designator == 'lemma') {
            var word_label = val.label;
            var frequency = val.count;
            var level = val.level;
            var rank = val.rank;
          }
          if (designator == 'form') {
            var word_label = val.canonical;
            var frequency = val.count;
            var level = val.level;
            var rank = 'No data yet';
          }
          if (designator == 'lemma_to_forms') {
            var word_label = val.form;
            var frequency = val.frequency;
            var level = result['level'];
            var rank = 'No data yet';
          }
          if (level != "") {
            if (!unique_words.has(word_label)) {
              array.push({'word' : word_label, 'freq' : frequency, 'level' : level, 'rank' : rank});
              unique_words.add(word_label);
            }
          }
        }
        array.sort((a, b) => (a.freq < b.freq) ? 1 : -1);
        return array;
      }

      function before_rank_lemmas() {
        // $("#type").empty();
        $("#qlerror").html("").hide();
        $("#outputtable").empty();
        $("#results").hide();
      }
      function after_rank_lemmas(array, designator) {
        $("#results").show();
        if (designator == 'form' || designator == 'lemma_to_forms') {
          var frequency_title = 'Form  Frequency';
        }
        else {
          var frequency_title = 'Lemma  Frequency'
        }
        $("#outputtable").append('<tr style="color:gray"><th> Word </th><th>' + frequency_title + '</th><th> Rank </th></tr>');
        if (array.length == 0) {
          $("#outputtable").text('No input data found.');
        }
        for (const token of array) {
          $("#outputtable").append('<tr><th data-level=' + token.level + '>' 
          + token.word + '</th><th>' + token.freq + '</th><th>' + token.rank + '</th></tr>');
        }
      }
      // error
      function error(err) {
        console.log("Error generating lemma frequencies:", err);
        $("#qlerror").html(err.statusText || "Error generating lemma frequencies").show();
        writeframe('outputpreview', 'Error');
      }
    // practice
    $(document).ready(async function () {
        console.log("ready!");
        $("#sortedlemmabtn").on("click", sorted_lemmas);
        $("#sortedformbtn").on("click", sorted_forms);
        $("#getformsbtn").on("click", get_forms);
    });

      // Just execute "demo()" in the console to populate the input with sample HTML.
    window.demo = function() {
      var input_list = 'простой, скорый, скучный, сильный, спокойный, старый, строгий, сухой, счастливый, твёрдый';
      $("#contentinput").val(input_list);
    }

})(jQuery);

// простая, простой, простые, простое, простом, простого