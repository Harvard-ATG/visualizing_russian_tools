// RESET THE PARSER, RUNS WHEN NEW QUERY IS SUBMITTED
function clearAll(){
    $('#parsed').html('');
    $('#textinput').val('');
    $('#levels').html('');
    $('#textinfo').html('');
    $('#wordinfo').html('');
}

// CREATE UNIQUE IDENTIFIER FOR EACH WORD
var next_word_id = (function() {
  var _SEQ = 0;
  return function() {
    var word_id = "word" + _SEQ.toString(10);
    _SEQ++;
    return word_id;
  };
})(0);

// GET THE VALUE OF ALL TEXT ENTERED BY THE USER
function getTextInput(){
    var $input = $("#textinput");
    var text = $input.val();
    return text.split(/(\s+)/g).filter(function(str) {
      return str != "";
    });
}

function clearTextInput(){
  $("#textinput").val('');
}

function parse(){
    var data = getTextInput();
    clearTextInput();

    $('#parsed').html('');
    console.log("parse", data);
    $(data).each(function(index,l){
        // Render whitespace in the parsed output
        var matchwhitespace = l.match(/^\s+$/g) || [];
        if(matchwhitespace.length > 0) {
            var whitespace = l.replace(/[\n\r]/g, "<br>").replace(/[\t]/g, '<i class="tabspace">&emsp;</i>');
            if(whitespace.length > l.length) {
              $("#parsed").append(whitespace);
            }
            return;
        }

        // Normalize the word token
        var word = l.toLowerCase().replace(/[.\…,\/\«\»\—\„\—\#\!\?\$\%\^\&\*\;\:\{\}\=\_\`\~\[\]\(\)\"]/g,"").replace('а́', 'а').replace('е́', 'е').replace('и́', 'и').replace('о́', 'о').replace('у́', 'у').replace('ы́', 'ы').replace('э́', 'э').replace('ю́', 'ю').replace('я́', 'я').replace('ё', 'е');

        // CHECK IF WORD CONTAINS A HYPHEN, IN WHICH CASE BREAK IT INTO TWO WORDS TO BE
        // PARSED SEPARATELY, EXCEPT IN THE CASE OF "по-" BECAUSE THE DATABASE HAS
        // SEPARATE ENTRIES FOR WORDS THAT BEGIN WITH "по-"
        if ( word.indexOf("-") !== -1 && word.indexOf("по-") == -1){
          var splitword = word.split("-");
          for (var f=0; f < splitword.length; f++){
            if (f == 0){
              $('#parsed').append("<span class='word rnopadding' id=" + uuid + " data-lexeme=" + splitword[f] + ">" + l.split("-")[f] + "-</span>");
            }
            else if (f > 0 && f < word.split("-").length - 1){
              var uuid = next_word_id();
              $('#parsed').append("<span class='word lnopadding rnopadding' id=" + uuid + " data-lexeme=" + splitword[f] + ">" + l.split("-")[f] + "-</span>");
            }
            else {
              var uuid = next_word_id();
              $('#parsed').append("<span class='word lnopadding' id=" + uuid + " data-lexeme=" + splitword[f] + ">" + l.split("-")[f] + "</span> ");
            }

          }
        }

        // ALSO CHECK FOR THE PRESENCE OF A VERTICAL BAR AND PARSE EACH WORD
        // SEPARATELY BEFORE BRINGING IT ALL BACK TOGETHER
        else if (word.indexOf("|") !== -1){
          for (var f=0; f < word.split("|").length; f++){
            if (f == 0){
                            var uuid = next_word_id();
              $('#parsed').append("<span class='word rnopadding' id=" + uuid + " data-lexeme=" + word.split("|")[f] + ">" + l.split("|")[f] + "|</span>");
            }
            else if (f > 0 && f < word.split("|").length - 1){
              var uuid = next_word_id();
              $('#parsed').append("<span class='word lnopadding rnopadding' id=" + uuid + " data-lexeme=" + word.split("|")[f] + ">" + l.split("|")[f] + "|</span>");
            }
            else {
              var uuid = next_word_id();
              $('#parsed').append("<span class='word lnopadding' id=" + uuid + " data-lexeme=" + word.split("|")[f] + ">" + l.split("|")[f] + "</span> ");
            }
          }
        }
        else {
          var uuid = next_word_id();
          $('#parsed').append("<span class='word' id=" + uuid + " data-lexeme=" + word + ">" + l + "</span> ");
        }
    });

    var words = $('.word');
    var wordData = [];
    $(words).each(function(x,y){
        wordData.push({"id": $(y).attr("id"), "lexeme": $(y).attr("data-lexeme")});
    });

	$.ajax ({
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
	$('#textinfo').html('<h4 class="inline">Word Count:</h4><span class="numbers"> ' + wl + '</span><br/><h4 class="inline">Unparsed Count:</h4><span class="numbers"> ' + counts[0] + '</span><br/><h4 class="inline">L1 Count:</h4><span class="numbers"> ' + counts[1] + '</span><br/><h4 class="inline">L2 Count:</h4><span class="numbers"> ' + counts[2] + '</span><br/><h4 class="inline">L3 Count:</h4><span class="numbers"> ' + counts[3] + '</span><br/><h4 class="inline">L4 Count:</h4><span class="numbers"> ' + counts[4] + '</br>');

}

function scrollToAnalysis() {
	$([document.documentElement, document.body]).animate({
        scrollTop: $("#analysis").offset().top
    }, 1000);
}


$('#parsebtn').on('click', function(e) {
   $("#analysis").removeClass('d-none');
   scrollToAnalysis();
   parse();
   e.stopPropagation();
   e.preventDefault();
});

$('#clearbtn').on('click', function(e) {
   clearAll();
   e.stopPropagation();
   e.preventDefault();
});

$(document).on('click', '.toggle', function(){
    $('.multiple').toggleClass('underline');
});

$(document).on('click', '.parsed', function(){
    var lemmas = [];
    var pos = [];
    var levels = [];
    var types = [];
    var forms = $(this).data("form") || [];
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

    $('#wordinfo').html('');
    $('#wordinfo').append('<h3 span="wordtitle inline">'+$(this).data('lexeme')+'</h3>');
    if(lemmas.length > 0) {
      $('#wordinfo').append("<h4 span='wordtitle inline'>Lemma:</h4> <span class='numbers'>" + lemmas + "</span>");
    }
    $('#wordinfo').append("<h4 span='wordtitle inline'>Parts of Speech:</h4> <span class='numbers'>" + pos + "</span>");
    $('#wordinfo').append("<h4 span='wordtitle inline'>Levels:</h4> <span class='numbers'>" + levels + "</span>");
    $('#wordinfo').append("<h4 span='wordtitle inline'>Inflections:</h4> <span class='numbers'>" + types + "</span>");
});

$(document).on("scroll", function(e) {
  var sidebar_left = $("#sidebar").offset().left;
  if ($(document).scrollTop() > $("#parsed").offset().top) {
    $("#sidebar").addClass("rus-sidebar-fixed").css("left", sidebar_left + "px");
  } else {
    $("#sidebar").removeClass("rus-sidebar-fixed").css("left", "");
  }
});
