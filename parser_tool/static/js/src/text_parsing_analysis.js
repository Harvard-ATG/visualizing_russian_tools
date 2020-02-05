(function(global, $) {
  "use strict";

  /**
   * Utilities
   */
  var utils = {
    htmlEntities: function(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    unique: function(arr) {
      var onlyUnique = function(value, index, self) { 
        return self.indexOf(value) === index;
      };
      return arr.filter(onlyUnique);
    },
    logEvent: function(fn) {
      return function(e) {
        console.log("event: ", e.type, e.target, e);
        return fn(e);
      };
    },
    scrollTo: function(selector) {
      var scrollTop = $(selector).offset().top;
      $([document.documentElement, document.body]).animate({scrollTop: scrollTop}, 1000);
    }
  };
  

  /**
   * Parse Service
   * 
   * Responsible for submitting parse requests to the backend, storing data,
   * and querying the returned data.
   */
  var parseService = {
    url: "/api/parsetext?html=y",
    data: null,
    error: false,
    parse: function(text) {
      var jqXhr = $.ajax ({
        type: "POST",
        url: this.url,
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify({text: text})
      });

      var handleSuccess = function(data, textStatus) {
        console.log("parse successful: ", textStatus);
        this.data = data;
        this.error = false;
      }.bind(this);

      var handleError = function(jqXhr, textStatus, errorThrown) {
        var error, res, reason, traceback;
        console.log("parse error: ", textStatus, errorThrown);
        try {
          res = JSON.parse(jqXhr.responseText);
          reason = (res.error && res.error.reason) || "Unknown error [1] - response did not provide error details";
          traceback = (res.error && res.error.traceback) || "";
          error = {"reason": reason, "traceback": traceback};
        } catch(caughtError) {
          console.log(caughtError);
          error = {"reason": "Unknown error [2] - failed to parse error response"};
        }
        this.data = null;
        this.error = error;
        console.log(error);
      }.bind(this);

      jqXhr.then(handleSuccess, handleError);

      return jqXhr;
    },
    getWordInfo: function(form_ids) {
      var data = this.data;
      if(!data || !form_ids || form_ids.length == 0) {
        return null;
      }
      var word_info = {forms: [], lemmas: []};
      var form_id, form, lemma;
      for(var i = 0; i < form_ids.length; i++) {
        form_id = form_ids[i];
        form = data.forms[form_id];
        lemma = data.lemmas[form.lemma_id];
        word_info.forms.push(form);
        word_info.lemmas.push(lemma);
      }
      return word_info;
    }
  };

  /**
   * Parsed Text Controller
   * 
   * Responsible for rendering and manipulating the parsed text.
   */
  var parsedTextCtrl = {
    render: function(data) {
      $("#analysis").removeClass("d-none");
      $("#parsed").html(data.html);
      this.updateWordsWithMultiple();
    },
    reset: function() {
      $('#parsed').html('');
    },
    getElementDataFormIds: function(el) {
      var form_ids = $(el).data("form-ids") || "";
      return String(form_ids).split(",");
    },
    toggleMultiple: function() {
      $('.multiple').toggleClass('underline');
    },
    toggleLemmas: function() {
      var self = this;
      if(!self.hasOwnProperty("showLemmas")) {
        self.showLemmas = false;
      }
      self.showLemmas = !self.showLemmas;
  
      $(".word.parsed").each(function(idx, el) {
        var form_ids = self.getElementDataFormIds(el);
        var word_info = parseService.getWordInfo(form_ids);
        var form, lemma, is_capitalized;
        if(word_info) {
          if(self.showLemmas) {
            form = $(el).html();
            is_capitalized = (form.charAt(0) == form.charAt(0).toUpperCase());
            lemma = word_info.lemmas[0].label;
            lemma = (is_capitalized ? lemma.charAt(0).toUpperCase() + lemma.substr(1) : lemma);
            $(el).data("form", form);
            $(el).html(lemma);
          } else {
            $(el).html($(el).data("form"));
          }
        }
      });
    },
    updateWordsWithMultiple: function() {
      var self = this;
      $(".word.parsed").each(function(idx, el) {
        var form_ids = self.getElementDataFormIds(el);
        if(form_ids.length > 1) {
          $(el).addClass("multiple");
        }
      });
    }
  };

  /**
   * Word Info Controller
   * 
   * Responsible for rendering word information alongside the parsed text.
   */
  var wordInfoCtrl = {
    render: function(data) {
      var form_ids = data.form_ids;
      var word_info = null;
      var html = '';
      if(form_ids) {
        word_info = parseService.getWordInfo(form_ids);
        if(word_info) {
          html = this.template(word_info);
        }
      }
      console.log("form_ids", form_ids, "word_info", word_info);
      $("#wordinfo").html(html);
    },
    setPosition: function(position) {
      var top = parseInt(position.top, 10);
      if(top) {
        $("#wordinfo").css({"top": top+"px"});
      } else {
        $("#wordinfo").css({"top": ""});
      }
    },
    reset: function() {
      $("#wordinfo").html("Click on a word.");
    },
    template: function(word_info) {
      var form = word_info.forms[0].label;
      var lemmas = utils.unique(word_info.lemmas.map(function(lemma) { return lemma.label; }));
      var translations = utils.unique(word_info.lemmas.map(function(lemma) { return lemma.translation; }));
      var pos = utils.unique(word_info.lemmas.map(function(lemma) { return lemma.pos; }));
      var levels = utils.unique(word_info.lemmas.map(function(lemma) { return lemma.level; }));
      var types = utils.unique(word_info.forms.map(function(form) { return form.type; }));

      var html = '<h3 class="wordtitle inline d-block">'+form+'</h3>';
      if(lemmas.length > 0) {
        html += '<span>Lemma:</span> <span class="textinfoval">' + lemmas.join(", ") + "</span><br>";
      }
      html += '<span>Parts of Speech:</span> <span class="textinfoval">' + pos.join(", ") + "</span><br>";
      html += '<span>Levels:</span> <span class="textinfoval">' + levels.join(", ") + "</span><br>";
      html += '<span>Inflections:</span> <span class="textinfoval">' + types.join(", ") + "</span><br>";
      html += '<span>Translation:</span> <span class="textinfoval">' + translations.join(", ") + "</span><br>";
      return html;
    }
  };

  /**
   * Text Info Controller
   * 
   * Responsible for displaying and manipulating statistics about the parsed text.
   */
  var textInfoCtrl = {
    render: function(data) {
      this.counts = this.getCounts();
      this.generateChart();
      this.showTextInfo();
    },
    reset: function() {
      this.counts = null;
      $("#levels").html('');
      $("#textinfo").html('');
    },
    getCounts: function() {
      var counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0};
      $('.word[data-level]').each(function(index, el) {
          counts[parseInt($(el).attr("data-level")[0])] += 1;
      });
      counts[0] = $('.word').length - $('.word[data-level]').length;
      return counts;
    },
    generateChart: function() {
      var self = this;
      var counts = this.counts;
      var chart = c3.generate({
        bindto: '#levels',
        data: {
            type: 'pie',
            columns: [
                ['L_', counts[0]],
                ['L1', counts[1]],
                ['L2', counts[2]],
                ['L3', counts[3]],
                ['L4', counts[4]]
            ],
            colors: { 
              L_: '#333333', 
              L1: 'green', 
              L2: 'blue', 
              L3: '#8000ff' ,
              L4: 'orange' 
            },
            onclick: function (d, i) { 
              console.log("onclick", d, i); 
              var levelnum = d.id.charAt(1);
              var $word = $(".word");

              if(self.levelnum == levelnum) {
                $word.removeClass("masklevel");
              } else {
                if(parseInt(levelnum, 10)) {
                  $word.removeClass("masklevel");
                  $word.not(".level"+levelnum).addClass("masklevel");
                } else if(levelnum == "_") {
                  $word.addClass("masklevel");
                }
              }
              self.levelnum = levelnum;
            }
        }
      });
    },
    showTextInfo: function() {
      var counts = this.counts;
      var wl = $('.word').length;
      var html = "";
      html += '<div>Word Count: <span class="numbers mr-4"> ' + wl + '</span></div>';
      html += '<div>Unparsed Count: <span class="numbers mr-4"> ' + counts[0] + '</span></div>';
      html += '<div>L1 Count: <span class="numbers mr-4"> ' + counts[1] + '</span></div>';
      html += '<div>L2 Count: <span class="numbers mr-4"> ' + counts[2] + '</span></div>';
      html += '<div>L3 Count: <span class="numbers mr-4"> ' + counts[3] + '</span></div>';
      html += '<div>L4 Count: <span class="numbers mr-4"> ' + counts[4] + '</span></div>';
      html += '<button type="button" id="textinfocopy" class="btn btn-secondary btn-sm">Copy to clipboard</button>';
      $('#textinfo').html(html);
    },
    copyToClipboard: function() {
      var copyText = document.querySelector("#textinfo");
      var range = document.createRange();
      range.selectNode(copyText)
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
    }
  };

  /**
   * Input Text Controller
   * 
   * Responsible for managing the input text and showing error messages.
   */
  var inputTextCtrl = {
    getInputText: function() {
      var text = $('#textinput').val().replace(/\s+$/g, '');
      return text;
    },
    error: function(error) {
      var html = '<h4 class="alert-heading">Parse Text Error</h4>';
      html += 'There was a problem parsing the text.<br>';
      if(error.reason) {
        html += '<b>Reason:</b> '+utils.htmlEntities(error.reason)+'<br>';
      }
      if(error.traceback) {
        html += '<hr><pre>' + utils.htmlEntities(error.traceback)+'</pre>';
      }
      $("#parser-error").html(html).removeClass('d-none');
      return this;
    },
    clearError: function() {
      $("#parser-error").addClass('d-none').html('');
      return this;
    },
    clearInput: function() {
      $('#textinput').val('');
      return this;
    },
    showLoadingIndicator: function() {
      $("#parsespinner").removeClass("d-none");
    },
    hideLoadingIndicator: function() {
      $("#parsespinner").addClass("d-none");
    },
    reset: function() {
      this.clearError();
      this.clearInput();
      this.hideLoadingIndicator();
    }
  };

  /**
   * Main Controller
   * 
   * Responsible for handling page-level actions/events and delegating to controllers 
   * for further processing and rendering as appropriate.
   */
  var mainCtrl = {
    onClickParse: function(e) {
      var text = inputTextCtrl.getInputText();
      console.log("parse text: ", text);

      mainCtrl.clearAnalysis();
      inputTextCtrl.clearError();
      inputTextCtrl.showLoadingIndicator();      

      parseService.parse(text).then(function() {
        parsedTextCtrl.render(parseService.data);
        textInfoCtrl.render(parseService.data);
        inputTextCtrl.hideLoadingIndicator();
        utils.scrollTo("#analysis");
      }, function(jqXhr, textStatus) {
        inputTextCtrl.hideLoadingIndicator();
        inputTextCtrl.error(parseService.error);
      });
    },
    onClickClear: function(e) {
      mainCtrl.clearAnalysis();
      inputTextCtrl.reset();
    },
    onClickWord: function(e) {
      var $el = $(e.target);
      if($el.hasClass("highlight")) {
        $el.removeClass("highlight");
        wordInfoCtrl.reset();
      } else {
        $(".word.highlight").removeClass("highlight");
        $el.addClass("highlight");
        var form_ids = parsedTextCtrl.getElementDataFormIds($el);
        wordInfoCtrl.render({form_ids: form_ids});
        wordInfoCtrl.setPosition({top: $el.position().top });
      }
      return false;
    },
    onClickUnderlineToggle: function(e) {
      parsedTextCtrl.toggleMultiple();
    },
    onClickLemmaToggle: function(e) {
      parsedTextCtrl.toggleLemmas();
    },
    onClickCopyTextInfo: function(e) {
      textInfoCtrl.copyToClipboard();
    },
    clearAnalysis: function() {
      parsedTextCtrl.reset();
      textInfoCtrl.reset();
      wordInfoCtrl.reset();
      $("#analysis").addClass("d-none");
      return this;
    }
  };

  
  // Page-level event handlers registered here
  $(document).ready(function() {
    $(document).on('click', '#parsebtn', utils.logEvent(mainCtrl.onClickParse));
    $(document).on('click', '#clearbtn', utils.logEvent(mainCtrl.onClickClear));
    $(document).on('click', '.underline-toggle', utils.logEvent(mainCtrl.onClickUnderlineToggle));
    $(document).on('click', '.word.parsed', utils.logEvent(mainCtrl.onClickWord));  
    $(document).on('click', '.lemma-toggle', utils.logEvent(mainCtrl.onClickLemmaToggle));
    $(document).on('click', '#textinfocopy', utils.logEvent(mainCtrl.onClickCopyTextInfo));
  });

})(window, jQuery);
