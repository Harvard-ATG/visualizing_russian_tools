(function($) {
  const ApiClient = window.app.ApiClient;
    // practice
    async function sorted_lemmas() {
      await display(make_lemma_array, true)
    }
    async function lemmas() {
      await display(make_lemma_array, false)
    }
    async function sorted_forms() {
      await display(make_form_array, true)
    }
    async function forms() {
      await display(make_form_array, false)
    }

    async function display(fun, sorted_bool) {
        const api = new ApiClient();
        var input_text = $("#contentinput").val();
        try {
          before_rank_lemmas();
          const jqXhr = api.lemmatizetext(input_text); 
          jqXhr.then(function(result, textStatus) {
            var array = fun(result);
            if (sorted_bool) {
              console.log('sorted_bool = true');
              array.sort((a, b) => (a.freq < b.freq) ? 1 : -1);
            }
            after_rank_lemmas(array);
          });
        } catch(err) {
          error(err);
        }
      };
      function make_form_array(jqXhr_result, sorted_bool) {
        var values = Object.values(jqXhr_result.data.forms);
        var array = [];
        var unique_words = [];
        console.log(values)
        for (const val of values) {
          if (!unique_words.includes(val.label)) {
            if (val.frequency == null) {
              array.push({'word' : val.label, 'freq' : 'No data', 'level' : '6U'});
            }
            else {
              array.push({'word' : val.label, 'freq' : val.frequency, 'level' : '6U'});
            }
            unique_words.push(val.label);
          }
        };
        return array;
      }

      function make_lemma_array(jqXhr_result, sorted_bool) {
        var values = Object.values(jqXhr_result.data.tokens);
        var array = [];
        for (const val of values) {
          if (val.tokentype == 'RUS') {
            if (val.count == null) {
              array.push({'word' : val.canonical, 'freq' : 'No data', 'level' : val.level});
            }
            else {
              array.push({'word' : val.canonical, 'freq' : val.count, 'level' : val.level});
            }
          }
        };
        return array;
      }

      function before_rank_lemmas() {
        // $("#type").empty();
        $("#qlerror").html("").hide();
        $("#outputtable").empty();
        $("#results").hide();
      }
      function after_rank_lemmas(array) {
        $("#results").show();
        if (array.length == 0) {
          $('#outputtable').text('No input data found.');
        }
        for (const token of array) {
          $('#outputtable').append('<tr><th data-level=' + token.level + '>' + token.word + '</th><th>' + token.freq + '</th></tr>');
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
        $('#lemmabtn').on('click', lemmas);
        $("#sortedlemmabtn").on("click", sorted_lemmas);
        $("#formbtn").on("click", forms);
        $("#sortedformbtn").on("click", sorted_forms);
    });

      // Just execute "demo()" in the console to populate the input with sample HTML.
    window.demo = function() {
      var input_list = 'простой, скорый, скучный, сильный, спокойный, старый, строгий, сухой, счастливый, твёрдый';
      $("#contentinput").val(input_list);
    }

})(jQuery);

// простая, простой, простые, простое, простом, простого