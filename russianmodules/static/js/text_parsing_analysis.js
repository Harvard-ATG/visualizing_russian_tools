var model = (function() {
  "use strict";

  var ONLY_PUNCT_RE = /^[.\…,\/\«\»\—\„\—\#\!\?\$\%\^\&\*\;\:\{\}\=\_\`\~\[\]\(\)\"]+$/g;
  var MATCH_PUNCT_RE = /[.\…,\/\«\»\—\„\—\#\!\?\$\%\^\&\*\;\:\{\}\=\_\`\~\[\]\(\)\"]/g;

  var Word = function (text) {
    this.text = text || "";
    this.id = null;
  };
  Word.prototype.isHyphenated = function() {
    return this.text.indexOf("-") !== -1 && this.text.length > 1;
  };
  Word.prototype.isSpecialHyphenated = function() {
    return this.text.indexOf("по-") !== -1;
  };
  Word.prototype.isBarSeparated = function() {
    return this.text.indexOf("|") !== -1 && this.text.length > 1;
  };
  Word.prototype.isWhitespace = function() {
    var m = this.text.match(/^\s+$/g) || [];
    return m.length > 0;
  };
  Word.prototype.isPunct = function() {
    var m = ONLY_PUNCT_RE.exec(this.text) || [];
    return m.length > 0;
  };
  Word.prototype.normalized = function() {
    var result = this.text.toLowerCase()
      .replace(MATCH_PUNCT_RE,"")
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
  Word.prototype.split = function(separator) {
    if(typeof separator !== "string" || separator === "") {
      separator = "-";
    }
    return this.text.split(separator).filter(function(s) { return s !== ""; });
  };


  var Tokenizer = function () {};
  Tokenizer.prototype.tokenize = function(text) {
    return text.split(/(\s+)/g).filter(function(s) {
      return s != "";
    });
  };

  var Parser = function () {};
  Parser.prototype.parse = function(text) {
    var tokenizer = new Tokenizer();
    var tokens = tokenizer.tokenize(text);
    var words = [], word;
    for(var i = 0; i < tokens.length; i++) {
      word = new Word(tokens[i]);
      word.id = i;
      words.push(word);
    }
    return words;
  };

  return {
    Word: Word,
    Tokenizer: Tokenizer,
    Parser: Parser
  };
})();


// ---------------------------------------------------
function clearAll(){
    $('#parsed').html('');
    $('#textinput').val('');
    $('#levels').html('');
    $('#textinfo').html('');
    $('#wordinfo').html('');
}
function getTextInput(){
    var $input = $("#textinput");
    var text = $input.val();
    return text;
}
function clearTextInput(){
  $("#textinput").val('');
  $("#textinput").height(100);
}
function clearParsed(){
  $("#parsed").html('');
}

function renderWord(lexeme, text, id, extraCls) {
  extraCls = extraCls || "";
  var span = document.createElement("span");
  var tn = document.createTextNode(text);
  span.dataset.lexeme = lexeme;
  span.id = "word" + id;
  span.className = "word " + extraCls;
  span.appendChild(tn);
  document.getElementById("parsed").appendChild(span);
}
function renderText(text) {
  $('#parsed').append(text);
}
function renderWhitespace(text) {
  var html = text.replace(/[\n\r]/g, "<br>").replace(/[\t]/g, '<i class="tabchar">&emsp;</i>');
  if(html.length > text) {
    $('#parsed').append(html);
  }
}
function renderSplit(word, sep) {
  var lexemes = word.normalized().split(sep);
  var texts = word.split(sep);
  var text, id, extraCls;
  for(var i = 0; i < lexemes.length; i++) {
    id = word.id + "-" + i;
    if(i === 0) {
      text = word.text + sep;
      extraCls = "rnopadding";
    } else if(i > 0 && i < lexemes.length-1) {
      text = word.text + sep;
      extraCls = "lnopadding rnopadding";
    } else {
      text = word.text;
      extraCls = "lnpadding";
    }
    renderWord(lexemes[i], texts[i], id, extraCls);
  }
}

function parse(){
    var text = getTextInput();
    clearTextInput();
    clearParsed();

    var parser = new model.Parser();
    var words = parser.parse(text);
    for(var i = 0; i < words.length; i++) {
      var word = words[i];
      if(word.isWhitespace()) {
        renderWhitespace(word.text);
      } else if(word.isPunct()) {
        renderText(word.text);
      } else if(word.isHyphenated() && !word.isSpecialHyphenated()) {
        // CHECK IF WORD CONTAINS A HYPHEN, IN WHICH CASE BREAK IT INTO TWO WORDS TO BE
        // PARSED SEPARATELY, EXCEPT IN THE CASE OF "по-" BECAUSE THE DATABASE HAS
        // SEPARATE ENTRIES FOR WORDS THAT BEGIN WITH "по-"
        renderSplit(word, "-");
      } else if(word.isBarSeparated()) {
        // ALSO CHECK FOR THE PRESENCE OF A VERTICAL BAR AND PARSE EACH WORD
        // SEPARATELY BEFORE BRINGING IT ALL BACK TOGETHER
        renderSplit(word, "|");
      } else {
        renderWord(word.normalized(), word.text, word.id);
      }
    }

    var wordData = [];
    $('.word').each(function(x,y){
        wordData.push({"id": $(y).attr("id"), "lexeme": $(y).attr("data-lexeme")});
    });

    return $.ajax ({
      type: "POST",
      url: "/api/lemmatize",
      data: JSON.stringify(wordData),
      dataType: "json",
      contentType: "application/json",
      success: function(data){
        visualize(data);
      },
      failure: function(err){
        console.log(err);
      }
    });
}

	function visualize(data){

		$(data).each(function(a,b){
			var element = "#" + b.element;
                        $(element).addClass("parsed");
			var inflection = b.inflection;
			var lemma = b.lemma;
			var form = {
				lemma: lemma,
				inflection: inflection
			};
			if ( $(element).data("form") === undefined){
				$(element).data("form", [ form ]);
			}
			else {
				$(element).data("form").push(form);
			}
		});

		$(".word").each(function(c,d){
		  var whichRank = 0, whichLevel = "";
			var forms = $(d).data("form");
			if(!forms || forms.length === 0) {
			  return;
      }

      for(let i = 0; i < forms.length; i++) {
        let f = forms[i];
        if (whichRank === 0 || (f.lemma.level <= whichLevel && parseInt(f.lemma.rank) <= whichRank)) {
          whichRank = parseInt(f.lemma.rank);
          whichLevel = f.lemma.level
        }
      }

      $(d).attr('data-level', whichLevel);
			if (forms.length > 1 ){
				$(d).addClass("underline multiple");
			}
		});

        $('.parsedui').append('<span class="toggle">U</span>');
        var counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0};
        $('.parsed').each(function(x,y){
            counts[parseInt($(y).attr("data-level")[0])] += 1;
        });
        counts[0] = $('.word').length - $('.parsed').length;
        var chart = c3.generate({
            bindto: '#levels',
            data: {
                columns: [
                    ['L_', counts[0]],
                    ['L1', counts[1]],
                    ['L2', counts[2]],
                    ['L3', counts[3]],
                    ['L4', counts[4]]
                ],
                type: 'pie',
                colors: { L_: '#333333', L1: 'green', L2: 'blue', L3: '#8000ff' , L4: 'orange' }
            }
        });

	var wl = $('.word').length;
	var html = "";
	html += '<span>Word Count:</span><span class="numbers"> ' + wl + '</span><br/>';
	html += '<span class="inline">Unparsed Count:</span><span class="numbers"> ' + counts[0] + '</span><br>';
	html += '<span class="inline">L1 Count:</span><span class="numbers"> ' + counts[1] + '</span><br>';
	html += '<span class="inline">L2 Count:</span><span class="numbers"> ' + counts[2] + '</span><br>';
	html += '<span class="inline">L3 Count:</span><span class="numbers"> ' + counts[3] + '</span><br>';
	html += '<span class="inline">L4 Count:</span><span class="numbers"> ' + counts[4] + '<br>';
	$('#textinfo').html(html);

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
