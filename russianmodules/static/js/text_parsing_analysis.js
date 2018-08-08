// RESET THE PARSER, RUNS WHEN NEW QUERY IS SUBMITTED
function clearAll(){
    $('#parsed').html('');
    $('#textinput').val('');
    $('#levels').html('');
    $('#textinfo').html('');
    $('#wordinfo').html('');
}

// CREATE UNIQUE IDENTIFIER FOR EACH WORD
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

// GET THE VALUE OF ALL TEXT ENTERED BY THE USER
function getTextInput(){
    var formatted = [];
    var textarea = $("#textinput");
    var text = textarea.val().split("\n");
    $(text).each(function(i,j){
        formatted.push(j.split(" "));
    });
    textarea.val('');
    return formatted;
}

function parse(){
    var data = getTextInput();
    $('#parsed').html('');

    $(data).each(function(i,j){
        $(j).each(function(k,l){
            var word = l.toLowerCase().replace(/[.\…,\/\«\»\—\„\—\#\!\?\$\%\^\&\*\;\:\{\}\=\_\`\~\[\]\(\)\"]/g,"").replace('а́', 'а').replace('е́', 'е').replace('и́', 'и').replace('о́', 'о').replace('у́', 'у').replace('ы́', 'ы').replace('э́', 'э').replace('ю́', 'ю').replace('я́', 'я').replace('ё', 'е');

            // CHECK IF WORD CONTAINS A HYPHEN, IN WHICH CASE BREAK IT INTO TWO WORDS TO BE
            // PARSED SEPARATELY, EXCEPT IN THE CASE OF "по-" BECAUSE THE DATABASE HAS
            // SEPARATE ENTRIES FOR WORDS THAT BEGIN WITH "по-"
            if ( word.indexOf("-") !== -1 && word.indexOf("по-") == -1){
                console.log("running");
            	var splitword = word.split("-");
            	for (var f=0; f < splitword.length; f++){
            		if (f == 0){
            			$('#parsed').append("<span class='word rnopadding' id=" + uuid + " data-lexeme=" + splitword[f] + ">" + l.split("-")[f] + "-</span>");
            		}
            		else if (f > 0 && f < word.split("-").length - 1){
            			var uuid = guid();
            			$('#parsed').append("<span class='word lnopadding rnopadding' id=" + uuid + " data-lexeme=" + splitword[f] + ">" + l.split("-")[f] + "-</span>");
            		}
            		else {
             			var uuid = guid();
            			$('#parsed').append("<span class='word lnopadding' id=" + uuid + " data-lexeme=" + splitword[f] + ">" + l.split("-")[f] + "</span> ");
            		}

            	}
            }

            // ALSO CHECK FOR THE PRESENCE OF A VERTICAL BAR AND PARSE EACH WORD
            // SEPARATELY BEFORE BRINGING IT ALL BACK TOGETHER
            else if (word.indexOf("|") !== -1){
            	for (var f=0; f < word.split("|").length; f++){
            		if (f == 0){
                                var uuid = guid();
            			$('#parsed').append("<span class='word rnopadding' id=" + uuid + " data-lexeme=" + word.split("|")[f] + ">" + l.split("|")[f] + "|</span>");
            		}
            		else if (f > 0 && f < word.split("|").length - 1){
            			var uuid = guid();
            			$('#parsed').append("<span class='word lnopadding rnopadding' id=" + uuid + " data-lexeme=" + word.split("|")[f] + ">" + l.split("|")[f] + "|</span>");
            		}
            		else {
             			var uuid = guid();
            			$('#parsed').append("<span class='word lnopadding' id=" + uuid + " data-lexeme=" + word.split("|")[f] + ">" + l.split("|")[f] + "</span> ");
            		}
            	}
            }
            else {
            	var uuid = guid();
            	$('#parsed').append("<span class='word' id=" + uuid + " data-lexeme=" + word + ">" + l + "</span> ");
            }
        });
        $('#parsed').append(" </br>");
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

		$('.word').each(function(c,d){

			var whichRank = 0;
			var whichLevel = "";

			if ( $(d).data("form") != undefined && $(d).data("form").length > 1 ){
				$(d).addClass("underline multiple");
			}

			if ( $(d).data("form") != undefined ){
				var forms = $(d).data("form");
				$(forms).each(function(e,f){
					if (whichRank == 0){
						whichRank = parseInt(f.lemma.rank);
						whichLevel = f.lemma.level;
					}
					else {
						if (parseInt(f.lemma.rank) < whichRank){
							whichLevel = f.lemma.level
						}
					}
				});
				$(d).attr('data-level', whichLevel);
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
    $('#wordinfo').html('');
    $('#wordinfo').append('<h3 span="wordtitle inline">'+$(this).data('lexeme')+'</h3>');

    var forminfo = $(this).data("form");
    var lemmas = [];
    var pos = [];
    var levels = [];
    var types = [];
    $(forminfo).each(function(x,y){
        pos.push(y.lemma.pos);
        lemmas.push(y.lemma.label);
        levels.push(y.lemma.level);
        types.push(y.inflection.type);
    });
    var lemmas_ = lemmas.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);
    var pos_ = pos.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);
    var levels_ = levels.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);
    var types_ = types.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);
    $('#wordinfo').append("<h4 span='wordtitle inline'>Lemma:</h4> <span class='numbers'>" + lemmas_ + "</span>");
    $('#wordinfo').append("<h4 span='wordtitle inline'>Parts of Speech:</h4> <span class='numbers'>" + pos_ + "</span>");
    $('#wordinfo').append("<h4 span='wordtitle inline'>Levels:</h4> <span class='numbers'>" + levels_ + "</span>");
    $('#wordinfo').append("<h4 span='wordtitle inline'>Inflections:</h4> <span class='numbers'>" + types_ + "</span>");
});

$(document).on("scroll", function(e) {
  var sidebar_left = $("#sidebar").offset().left;
  if ($(document).scrollTop() > $("#parsed").offset().top) {
    $("#sidebar").addClass("rus-sidebar-fixed").css("left", sidebar_left + "px");
  } else {
    $("#sidebar").removeClass("rus-sidebar-fixed").css("left", "");
  }
});