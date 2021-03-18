(function ($) {
  const ApiClient = window.app.ApiClient;
  async function sorted_lemmas() {
    display('lemma');
  }
  async function sorted_forms() {
    display('form');
  }
  async function get_forms() {
    display('lemma_to_forms');
  }
  async function get_rnc_data() {
    display('rnc');
  }
  async function clear() {
    before_display();
  }

  function display(designator) {
    const api = new ApiClient();
    var input_text = $("#contentinput").val();
    // handling lemma or form
    if ((designator == 'lemma') || designator == 'form') {
      // lemma
      if (designator == 'lemma') {
        document.getElementById('type_dropdown_options').value = 'lemmas';
        document.getElementById('source_dropdown_options').value = 'visrus';
      }
      // form
      else {
        document.getElementById('type_dropdown_options').value = 'forms';
        document.getElementById('source_dropdown_options').value = 'visrus';
      }
      before_display();
      const jqXhr = api.lemmatizetext(input_text);
      jqXhr.then(function (result, textStatus) {
        var array = make_array(result, designator);
        after_display(array, designator);
      })
    }
    // generating forms from lemma (button)
    if (designator == 'lemma_to_forms') {
      document.getElementById('type_dropdown_options').value = 'forms';
      before_display();
      const jqXhr = api.getforms(input_text);
      jqXhr.then(function (result, textStatus) {
        var source_type = $("#source_dropdown option:selected").val();
        var array = make_array(result, designator);
        // RNC
        if (source_type == 'rnc') {
          var forms = [];
          for (d of array) {
            forms.push(d.word);
          }
          const jqXhr_rnc = api.lemmatizetext(forms.join(' '));
          jqXhr_rnc.then(function (result_rnc, textStatus) {
            var rnc_array = make_rnc_array(result_rnc, 'forms', [])
            after_display(rnc_array, 'rnc');
          });
        }
        // non-RNC lemma to forms
        else {
          after_display(array, designator);
        }
      });
    }
    // RNC dropdown
    if (designator == 'rnc') {
      var word_type = $("#type_dropdown option:selected").val();
      // // RNC forms
      if (word_type == 'forms') {
        before_display();
        const jqXhr = api.lemmatizetext(input_text);
        jqXhr.then(function (result, textStatus) {
          var array = make_rnc_array(result, 'forms');
          after_display(array, designator);
        })
      }
      // RNC lemmas
      else {
        const jqXhr = api.lemmatizetext(input_text);
        jqXhr.then(function (result, textStatus) {
          var array = make_rnc_array(result, 'lemmas');
          after_display(array, designator);
        })
      }
    }
  };

  function make_rnc_array(result, word_type) {
    before_display();
    if (word_type == 'forms') { // RNC forms
      var values = result.data.tokens;
      console.log('values',values);
      var form_or_lemma = 'rnc_form_count';
      var word_label = 'canonical';
    } else { // RNC lemmas
      var values = Object.values(result.data.lemmas);
      console.log('values',values);
      var form_or_lemma = 'rnc_lemma_count';
      var word_label = 'label';
    }
      var array = [];
      for (const val of values) {
        if (val.level != "") {
          if (!val[form_or_lemma]) {
            var occurrences = 'None found';
          } else {
            var occurrences = val[form_or_lemma];
          }
          if (!val.rnc_doc_count) {
            var docs = 'None found';
          } else {
            var docs = val.rnc_doc_count;
          }
          array.push({
            'word': val[word_label], 'occurrences': occurrences,
            'docs': docs, 'level': val.level
          });
        }
      }
      array.sort((a, b) => (a.occurrences < b.occurrences) ? 1 : -1);
      console.log('array',array);
      return array;
  };

  function make_array(result, designator) {
    if (designator == 'lemma') {
      var values = Object.values(result.data.lemmas);
    }
    if (designator == 'form') {
      var values = Object.values(result.data.forms);
    }
    if (designator == 'lemma_to_forms') {
      var values = Object.values(result.data);
    }
    var array = [];
    let unique_words = new Set();
    for (const val of values) {
      if (designator == 'lemma') {
        var word_label = val.label;
        var frequency = val.count;
        var level = val.level;
        var rank = val.rank;
      }
      if (designator == 'form') {
        var word_label = val.label;
        var frequency = val.sharoff_freq;
        var level = val.level;
        var rank = val.sharoff_rank;
        // var  inflection = val.type;
      }
      if (designator == 'lemma_to_forms') {
        var word_label = val.form;
        var frequency = val.sharoff_freq;
        var level = result['level'];
        var rank = val.sharoff_rank;
      }
      if (level != "") {
        if (!unique_words.has(word_label)) {
          array.push({ 'word': word_label, 'freq': frequency, 'level': level, 'rank': rank });
          unique_words.add(word_label);
        }
      }
    }
    array.sort((a, b) => (a.freq < b.freq) ? 1 : -1);
    return array;
  }

  function before_display() {
    $("#outputtable").empty();
    $("#rnc_info").hide();
    $("#ngramtitle").empty();
    $("#ngramviewer").empty();
    $("#results").hide();
  }

  function after_display(array, designator) {
    document.getElementById("clearbtn_display").style.display = "block";
    document.getElementById("type_dropdown").style.display = "none";
    document.getElementById("source_dropdown").style.display = "none";
    $("#results").show();
    if (designator == 'form' || designator == 'lemma_to_forms') {
      var col1 = 'Form  Frequency';
      var col2 = 'Form  Rank';
      document.getElementById("type_dropdown").style.display = "block";
      document.getElementById("source_dropdown").style.display = "block";
    }
    else if (designator == 'rnc') {
      $("#rnc_info").hide().fadeIn(200).show();
      var col1 = 'Occurrences in RNC';
      var col2 = 'Documents in RNC';
      document.getElementById("type_dropdown").style.display = "block";
      document.getElementById("source_dropdown").style.display = "block";
    }
    else {
      var col1 = 'Lemma  Frequency';
      var col2 = 'Lemma  Rank';
      document.getElementById("type_dropdown").style.display = "block";
      document.getElementById("source_dropdown").style.display = "block";
    }
    var word_type = $("#type_dropdown option:selected").val();
    if (word_type == 'forms') {
      var lexeme = 'Inflection';
    }
    else {
      var lexeme = 'Lemma';
    }
    $("#outputtable").append('<tr style="color:gray"><th> ' + lexeme + ' </th><th>' + col1 + '</th><th>' + col2 + '</th></tr>').hide().fadeIn(200);

    if (array.length == 0) {
      $("#outputtable").text('No input data found or word not found in database.');
    }

    var direct_url = 't1%3B%2C';
    var content = '';
    var index = 0;
    for (const token of array) {
      if (designator == 'rnc') {
        var col1val = token.occurrences;
        var col2val = token.docs;
      }
      else {
        var col1val = token.freq;
        var col2val = token.rank;
      }
      $("#outputtable").append('<tr><th data-level=' + token.level + '>'
        + token.word + '</th><th>' + col1val + '</th><th>' + col2val + '</th></tr>');
      // for ngram viewer
      if (index != (array.length - 1)) {
        direct_url = direct_url + token.word + '%3B%2Cc0%3B.t1%3B%2C';
        content = content + token.word + '%2C+'
      }
      else {
        // deal with last element in array (differenr url endings)
        direct_url = direct_url + token.word + '%3B%2Cc0';
        content = content + token.word;
      }
      index += 1;
    }

    // add ngram
    $("#ngramtitle").append('<tr style="color:gray"><th> Google N-Gram Viewer</th><th>');
    $("#ngramviewer").append('<iframe name="ngram_chart" src="https://books.google.com/ngrams/interactive_chart?smoothing=3&direct_url=' + direct_url
      + '&corpus=36&year_start=1800&content=' + content
      + '&year_end=2010" width=750 height=800 marginwidth=0 marginheight=0 hspace=0 vspace=0 frameborder=0 scrolling=no></iframe>');
  };

  // ready
  $(document).ready(async function () {
    console.log("ready!");
    $("#rnc_info").hide();
    $("#clearbtn").on("click", clear); // clear view
    $("#sortedlemmabtn").on("click", sorted_lemmas); // basic lemma button
    $("#getformsbtn").on("click", get_forms); // generate forms
    // when type is changed between lemma/forms
    $("#type_dropdown").change(function () {
      var word_type = $("#type_dropdown option:selected").val();
      var source_type = $("#source_dropdown option:selected").val();
      if (word_type == 'forms') {
        if (source_type == 'visrus') {
          sorted_forms();
        } else {
          get_rnc_data();
        }
      } else {
        if (source_type == 'visrus') {
          sorted_lemmas();
        } else {
          get_rnc_data();
        }
      }
    });
    // when source is changed between visualizing russian / RNC
    $("#source_dropdown").change(function () {
      var source_type = $("#source_dropdown option:selected").val();
      if (source_type == 'rnc') {
        get_rnc_data()
      } else {
        sorted_lemmas();
      }
    });
  });

  // Just execute "demo()" in the console to populate the input with sample HTML.
  window.demo = function () {
    var input_list = 'простой, скорый, скучный, сильный, спокойный, старый, строгий, сухой, счастливый, твёрдый';
    $("#contentinput").val(input_list);
  }

})(jQuery);

// простая, простой, простые, простое, простом, простого 