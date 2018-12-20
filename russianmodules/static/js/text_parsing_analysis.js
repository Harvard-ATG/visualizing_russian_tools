var app = (function() {
  "use strict";

  var PUNCT = '.…,/«»–—„#!?$%^&*;:{}=_`~[]()"'; // includes en-dash and em-dash, but not hyphen-minus intentionally
  var PUNCT_ESCAPED = PUNCT.replace('[', '\\[').replace(']', '\\]');
  var REGEX_IS_PUNCT = new RegExp("^[" + PUNCT_ESCAPED + "-" + "]+$", "g");
  var REGEX_STRIP_PUNCT = new RegExp("[" + PUNCT_ESCAPED + "]", "g");


  // --------------------------------------------------
  // Word object that implements some convenience methods
  var Word = function (text, id) {
    this.text = text || "";
    this.id = id;
  };
  Word.prototype.startsWith = function(prefix) {
    return this.text.substring(0, prefix.length) === prefix;
  };
  Word.prototype.isHyphenated = function() {
    return this.text.indexOf("-") !== -1 && this.text.length > 1;
  };
  Word.prototype.isBarSeparated = function() {
    return this.text.indexOf("|") !== -1 && this.text.length > 1;
  };
  Word.prototype.isWhitespace = function() {
    var m = this.text.match(/^\s+$/g) || [];
    return m.length > 0;
  };
  Word.prototype.isNumber = function() {
    var m = this.normalizeText().match(/^\d+$/g) || [];
    return m.length > 0;
  };
  Word.prototype.isPunct = function() {
    var m = REGEX_IS_PUNCT.exec(this.text) || [];
    return m.length > 0;
  };
  Word.prototype.normalizeText = function() {
    var result = this.text.toLowerCase()
      .replace(REGEX_STRIP_PUNCT,"")
      .replace('а́', 'а')
      .replace('е́', 'е')
      .replace('и́', 'и')
      .replace('о́', 'о')
      .replace('у́', 'у')
      .replace('ы́', 'ы')
      .replace('э́', 'э')
      .replace('ю́', 'ю')
      .replace('я́', 'я')
      .replace('ё', 'е');
    return result;
  };
  Word.prototype.split = function(separator, options) {
    options = options || {};
    if(typeof separator !== "string" || separator === "") {
      separator = "-";
    }
    var text = this.text;
    if(options.normalize) {
      text = this.normalizeText();
    }
    return text.split(separator).filter(function(s) { return s !== ""; });
  };


  // --------------------------------------------------
  // Tokenizes the text into simple text tokens separated by whitespace
  // Note: captures the whitespace too, so that tabs and newlines can be rendered appropriately
  var tokenize = function(text) {
    return text.split(/(\s+)/g).filter(function(s) {
      return s != "";
    });
  };


  // --------------------------------------------------
  // Parse the text into word objects
  var parse = function(text) {
    var tokens = tokenize(text);
    var words = [], word;
    for(var i = 0, len = tokens.length; i < len; i++) {
      word = new Word(tokens[i]);
      word.id = i;
      words.push(word);
    }
    return words;
  };


  // --------------------------------------------------
  // Lemmatizes the word data by quering the database with a list of the lexemes/word forms
  var lemmatize = function(wordData) {
    return $.ajax ({
      type: "POST",
      url: "/api/lemmatize",
      data: JSON.stringify(wordData),
      dataType: "json",
      contentType: "application/json"
    });
  };


  // --------------------------------------------------
  // Renders the parsed text
  var ParsedView = function(options) {
    options = options || {};
    this.$el = $(options.selector);
  };
  ParsedView.prototype.render = function(words) {
    this.$el.html("");
    for(var i = 0, len = words.length; i < len; i++) {
      var word = words[i];
      if(word.isWhitespace()) {
        this.renderWhitespace(word.text);
      } else if(word.isPunct()) {
        this.renderPlain(word.text);
      } else if(word.isHyphenated() && !word.startsWith("по-")) {
        // Break hyphenated words to be parsed separately, except in the case of "по-" because the database
        // has separate entries for those words.
        this.renderSplitLexeme(word, "-");
      } else if(word.isBarSeparated()) {
        // Break words separated by a vertical bar so they are parsed separately
        this.renderSplitLexeme(word, "|");
      } else {
        this.renderLexeme(word.normalizeText(), word.text, word.id);
      }
    }
    return this;
  };
  ParsedView.prototype.renderPlain = function(text) {
    this.$el.append(text);
  };
  ParsedView.prototype.renderWhitespace = function(text) {
    var html = text.replace(/[\n\r]/g, "<br>")
      .replace(/[\t]/g, '<i class="tabchar">&emsp;</i>');
    if(html.length > text) {
      this.$el.append(html);
    }
  };
  ParsedView.prototype.renderLexeme = function(lexeme, text, id, extraCls) {
    extraCls = extraCls || "";
    var span = document.createElement("span");
    span.id = "word" + id;
    span.className = "word" + (extraCls?" " + extraCls:"");
    span.dataset.lexeme = lexeme;
    span.appendChild(document.createTextNode(text));
    this.$el.append(span);
  };
  ParsedView.prototype.renderSplitLexeme = function(word, sep) {
    var lexemes = word.split(sep, {normalize: true });
    var texts = word.split(sep, {normalize: false });
    var text, id, extraCls;
    for(var i = 0; i < lexemes.length; i++) {
      id = word.id + "-" + i;
      if(i === 0) {
        text = texts[i] + sep;
        extraCls = "rnopadding";
      } else if(i > 0 && i < lexemes.length-1) {
        text = texts[i] + sep;
        extraCls = "lnopadding rnopadding";
      } else {
        text = texts[i];
        extraCls = "lnopadding";
      }
      this.renderLexeme(lexemes[i], text, id, extraCls);
    }
  };
  ParsedView.prototype.getRenderedLexemes = function() {
    var wordData = [];
    this.$el.find('.word').each(function(index, element){
      wordData.push({
        "id": $(element).attr("id"),
        "lexeme": $(element).attr("data-lexeme")
      });
    });
    return wordData;
  };
  ParsedView.prototype.error = function(err) {
    err = err || "";
    var msgText = "Parsing error: " + err;
    this.$el.html('<div class="alert alert-danger">' + msgText + '</div>');
  };
  ParsedView.prototype.visualize = function(data) {
    this.setWordData(data);
    this.setWordLevels();
  };
  ParsedView.prototype.setWordData = function(data) {
    var item, $word, form, forms;
    for(var i = 0; i < data.length; i++) {
      item = data[i];
      $word = $("#" + item.element);
      form = {lemma: item.lemma, inflection: item.inflection};
      forms = $word.data("form");
      if (forms === undefined){
        $word.data("form", [form]);
      } else {
        $word.data("form").push(form);
        if(forms.length > 1) {
          $word.addClass("underline multiple");
        }
      }
      $word.addClass("parsed");
    }
  };
  ParsedView.prototype.setWordLevels = function() {
    this.$el.find(".word").each(function(index, element){
      var whichRank = 0;
      var whichLevel = "";
      var forms = $(element).data("form");
      if(forms) {
        for (var i = 0; i < forms.length; i++) {
          var f = forms[i];
          if (whichRank === 0 || (f.lemma.level <= whichLevel && parseInt(f.lemma.rank) <= whichRank)) {
            whichRank = parseInt(f.lemma.rank);
            whichLevel = f.lemma.level
          }
        }
      }
      $(element).attr('data-level', whichLevel);
    });
  };
  ParsedView.prototype.getCountData = function() {
    var counts = [0,0,0,0,0,0,0];
    var $parsed = $('.parsed');
    var $words = $('.word');
    $parsed.each(function(index, element){
      var level = parseInt($(element).attr("data-level")[0]);
      counts[level] += 1;
    });
    counts[0] =  $words.length - $parsed.length;
    return {
      "total": $words.length,
      "parsed": $parsed.length,
      "unparsed": $words.length - $parsed.length,
      "levels": counts
    };
  };

  // --------------------------------------------------
  // Export objects and functions
  return {
    Word: Word,
    ParsedView: ParsedView,
    tokenize: tokenize,
    parse: parse,
    lemmatize: lemmatize
  };
})();



function clearAll(){
    $('#parsed').html('');
    $('#textinput').val('');
    $('#levels').html('');
    $('#textinfo').html('');
    $('#wordinfo').html('');
}

function parse(){
    var text = $("#textinput").val();
    $("#textinput").val('');
    $("#textinput").height(100);

    var words = app.parse(text);
    var parsedView = new app.ParsedView({selector: "#parsed"});
    parsedView.render(words);

    var wordData = parsedView.getRenderedLexemes();
    var jqXhr = app.lemmatize(wordData);

    jqXhr.done(function(data) {
      parsedView.visualize(data);
      var counts = parsedView.getCountData();
      showcounts(counts.total, counts.levels);
    }).fail(function(err) {
      console.error(err);
      parsedView.error(err);
    });
}

function showcounts(total, levels){
  var chart = c3.generate({
      bindto: '#levels',
      data: {
          columns: [
              ['L_', levels[0]],
              ['L1', levels[1]],
              ['L2', levels[2]],
              ['L3', levels[3]],
              ['L4', levels[4]]
          ],
          type: 'pie',
          colors: { L_: '#333333', L1: 'green', L2: 'blue', L3: '#8000ff' , L4: 'orange' }
      }
  });

	var html = "";
	html += '<span>Word Count:</span><span class="numbers"> ' + total + '</span><br/>';
	html += '<span class="inline">Unparsed Count:</span><span class="numbers"> ' + levels[0] + '</span><br>';
	html += '<span class="inline">L1 Count:</span><span class="numbers"> ' + levels[1] + '</span><br>';
	html += '<span class="inline">L2 Count:</span><span class="numbers"> ' + levels[2] + '</span><br>';
	html += '<span class="inline">L3 Count:</span><span class="numbers"> ' + levels[3] + '</span><br>';
	html += '<span class="inline">L4 Count:</span><span class="numbers"> ' + levels[4] + '<br>';
	$('#textinfo').html(html);
}

function getWordInfoForElement(wordElement) {
    var lemmas = [], pos = [], levels = [], types = [];
    var forms = $(wordElement).data("form") || [];
    var lexeme = $(wordElement).data("lexeme");
    $(forms).each(function(x,y){
        if(typeof y.lemma.pos != "undefined" && pos.indexOf(y.lemma.pos) == -1) {
          pos.push(y.lemma.pos);
        }
        if(typeof y.lemma.label  != "undefined" && lemmas.indexOf(y.lemma.label) == -1) {
          lemmas.push(y.lemma.label);
        }
        if(typeof y.lemma.level  != "undefined" && levels.indexOf(y.lemma.level) == -1) {
          levels.push(y.lemma.level);
        }
        if(typeof y.inflection.type  != "undefined" && types.indexOf(y.inflection.type) == -1) {
          types.push(y.inflection.type);
        }
    });

    var html = '<h3 class="wordtitle inline d-block">'+lexeme+'</h3>';
    if(lemmas.length > 0) {
      html += '<span>Lemma:</span> <span class="numbers">' + lemmas.join(", ") + "</span><br>";
    }
    html += '<span>Parts of Speech:</span> <span class="numbers">' + pos.join(", ") + "</span><br>";
    html += '<span>Levels:</span> <span class="numbers">' + levels.join(", ") + "</span><br>";
    html += '<span>Inflections:</span> <span class="numbers">' + types.join(", ") + "</span><br>";
    return html;
}

function scrollToAnalysis() {
	$([document.documentElement, document.body]).animate({
        scrollTop: $("#analysis").offset().top
    }, 1000);
}

$('#parsebtn').on('click', function(e) {
   $("#analysis").removeClass('d-none');
   //scrollToAnalysis();
   parse();
   e.stopPropagation();
   e.preventDefault();
});

$('#clearbtn').on('click', function(e) {
   clearAll();
   e.stopPropagation();
   e.preventDefault();
});

$(document).on('click', '.underline-toggle', function(){
    $('.multiple').toggleClass('underline');
});

$(document).on('click', '.parsed', function(e){
    if($(this).hasClass("highlight")) {
      $(this).removeClass("highlight");
      $("#wordinfo").html("Click on a word.");
    } else {
      $(".word.highlight").removeClass("highlight");
      $(this).addClass("highlight");
      $("#wordinfo").html(getWordInfoForElement(this));
    }
    return false;
});

/*
$(document).on("scroll", function(e) {
  var sidebar_left = $("#sidebar").offset().left;
  if ($(document).scrollTop() > $("#parsed").offset().top) {
    $("#sidebar").addClass("rus-sidebar-fixed").css("left", sidebar_left + "px");
  } else {
    $("#sidebar").removeClass("rus-sidebar-fixed").css("left", "");
  }
});
*/
