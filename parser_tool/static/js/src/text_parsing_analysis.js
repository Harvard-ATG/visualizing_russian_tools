(function($) {
  "use strict";

  // Imports
  const utils = window.app.utils;
  const theme = window.app.theme;
  const ApiClient = window.app.ApiClient;
  const FrequencyGauge = window.app.FrequencyGauge;
  const LevelsPieChart = window.app.LevelsPieChart;
  const LevelsBarChart = window.app.LevelsBarChart;
  const StressPatternTableComponent = window.app.StressPatternTableComponent;

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
      var distinct_lemmas = {};
      var word_info = {forms: [], lemmas: []};
      var form_id, form, lemma;
      for(var i = 0; i < form_ids.length; i++) {
        form_id = form_ids[i];
        form = data.forms[form_id];
        lemma = data.lemmas[form.lemma_id];
        word_info.forms.push(form);
        distinct_lemmas[lemma.id] = lemma;
      }
      for(var lemma_id in distinct_lemmas) {
        if(distinct_lemmas.hasOwnProperty(lemma_id)) {
          word_info.lemmas.push(distinct_lemmas[lemma_id]);
        }
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
    render: function(word_info) {
      if(word_info) {
        $("#worddetails").html(this.template(word_info));
        this.update(word_info);
      } else {
        this.reset();
      }

    },
    reset: function() {
      $("#worddetails").html("Click on a word.");
    },
    template: function(word_info) {
      var form = word_info.forms[0].label;
      var lemma_details = this.getLemmaDetails(word_info);

      var lemma_details_html = lemma_details.map((lemma, index) => {
        var stress_pattern_html = '';
        if(lemma.stress_pattern_semu) {
          stress_pattern_html = StressPatternTableComponent.render({
            props: {stress_pattern_semu: lemma.stress_pattern_semu}
          });
        }

        var html = `
          <div class="wordinfo-heading">${lemma.label}</div>
          <ul class="wordinfo-details">
            <li>Part of Speech: <i>${lemma.pos}</i></li>
            <li class="${lemma.gender?'':'d-none'}">Gender: <i>${lemma.gender}</i></li>
            <li class="${lemma.aspect?'':'d-none'}">Aspect: <i>${lemma.aspect}</i></li>
            <li class="${lemma.level?'':'d-none'}">Level: <i>${lemma.level}</i></li>
            <li class="${lemma.cases?'':'d-none'}">Cases: <i>${lemma.cases}</i></li>
            <li>Translation: <i>${lemma.translation||'n/a'}</i></li>
            <li class="${lemma.stress_pattern_semu?'':'d-none'}">Stress Pattern: <i>${lemma.stress_pattern_semu}</i><br>${stress_pattern_html}</li>
          </ul>
        `;

        return html;
      }).join("");

      var html = `
        <p>
        Word: <b>${form}</b> (<a href="https://translate.yandex.com/?lang=ru-en&text=${encodeURIComponent(form)}" rel="noreferrer noopener" style="font-size: 80%;" target="_blank">Yandex Translate</a>)<br>
        </p>
        ${lemma_details_html}
        <div id="verb-aspect-ratio-gauge"></div>`;

      return html;
    },
    update: function(word_info) {
      this.updatePosition();
      if(word_info.lemmas.length > 0) {
        this.drawVerbAspectRatioGauge(word_info.lemmas[0]);
      }
    },
    updatePosition: function() {
      var top = window.scrollY - (document.getElementById("wordinfo").getBoundingClientRect().top + document.documentElement.scrollTop);
      if(top < 0) {
        top = 0;
      }
      $("#worddetails").css({
        top: top+"px",
        position: (top == 0 ? "static": "absolute")
      });
    },
    drawVerbAspectRatioGauge: function(lemma) {
      var aspect_pair = (lemma.pos == "verb" && lemma.aspect_pair && lemma.aspect_pair.length == 2) ? lemma.aspect_pair : [];
      var aspect_data = aspect_pair.map((v) => {
        return {"label": v.lemma_label, "value": v.lemma_count, "description": v.aspect}
      });

      if(aspect_pair.length == 2) {
        let gauge = new FrequencyGauge({
          parentElement: "#verb-aspect-ratio-gauge",
          config: { colors: ['#b74c4c', '	#999']}
        });
        gauge.data(aspect_data);
        gauge.draw();
      }
    },
    getLemmaDetails: function(word_info) {
      var forms = word_info.forms.slice(0);
      var lemmas = word_info.lemmas.slice(0);
      var forms_by_lemma = forms.reduce((lookup, form) => {
        if(!lookup.hasOwnProperty(form.lemma_id)) {
          lookup[form.lemma_id] = [];
        }
        lookup[form.lemma_id].push(form);
        return lookup;
      }, {});

      var lemma_details = lemmas.map((lemma, index) => {
        return {
          label: lemma.label || '',
          pos: lemma.pos || '',
          gender: lemma.gender || '',
          level: lemma.level || '',
          aspect: lemma.aspect || '',
          translation: lemma.translation || '',
          stress_pattern_semu: lemma.stress_pattern_semu || '',
          cases: forms_by_lemma[lemma.id].map((form) => form.type).join(', ')
        }
      });

      return lemma_details;
    }
  };

  /**
   * Text Info Controller
   *
   * Responsible for displaying and manipulating statistics about the parsed text.
   */
  var textInfoCtrl = {
    group_levels: false,
    render: function() {
      this.counts = this.getCounts();
      this.generateCharts();
      this.showTextInfo();
    },
    reset: function() {
      this.counts = null;
      this.combine_levels = false;
      $("#levels").html('');
      $("#textinfo").html('');
    },
    getCounts: function() {
      var counts = {total: 0, 0: 0, 1: 0, 2: 0, 3: 0, 4: 0};
      var elementList = document.querySelectorAll('.word');
      elementList.forEach(function(el, index) {
        counts.total += 1;
        if('level' in el.dataset) {
          counts[parseInt(el.dataset.level, 10)] += 1;
        } else {
          counts[0] += 1;
        }
      });
      return counts;
    },
    generateCharts: function() {
      var barchart = new LevelsBarChart({
        counts: this.counts,
        bindto: "#chart-bar",
        combineLevels: this.combine_levels
      });
      var piechart = new LevelsPieChart({
        counts: this.counts,
        bindto: "#chart-pie",
        combineLevels: this.combine_levels
      });
      barchart.generate();
      piechart.generate();
    },
    showTextInfo: function() {
      var counts = this.counts;
      var html = '';
      html += '<div>Word Count: <span class="numbers mr-4"> ' + counts.total + '</span></div>';
      html += '<div>Unparsed Count: <span class="numbers mr-4"> ' + counts[0] + '</span></div>';
      html += '<div>L1 Count: <span class="numbers mr-4"> ' + counts[1] + '</span></div>';
      html += '<div>L2 Count: <span class="numbers mr-4"> ' + counts[2] + '</span></div>';
      html += '<div>L3 Count: <span class="numbers mr-4"> ' + counts[3] + '</span></div>';
      html += '<div>L4 Count: <span class="numbers mr-4"> ' + counts[4] + '</span></div>';
      html += '<button type="button" id="textinfocopy" class="btn btn-secondary btn-sm">Copy to clipboard</button>';
      html += '<div id="textinfocsv" style="display:none;">';
      html += ['Word Count', 'Unparsed', 'L1', 'L2', 'L3', 'L4'].join(",") + "<br>";
      html += [counts.total, counts[0], counts[1], counts[2], counts[3], counts[4]].join(",") + "\n";
      html += '</div>';
      $('#textinfo').html(html);
    },
    copyToClipboard: function() {
      var copyText = document.querySelector("#textinfocsv");
      copyText.style.display = "";
      var range = document.createRange();
      range.selectNode(copyText)
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
      copyText.style.display = "none";
    },
    toggleChartLevels: function() {
      this.combine_levels = !this.combine_levels;
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
    api: new ApiClient(),
    onClickParse: function(e) {
      var text = inputTextCtrl.getInputText();
      console.log("parse text: ", text);

      mainCtrl.clearAnalysis();
      inputTextCtrl.clearError();
      inputTextCtrl.showLoadingIndicator();
      mainCtrl.colorReadability()

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
      if(e.target.classList.contains("highlight")) {
        e.target.classList.remove("highlight");
        wordInfoCtrl.reset();
      } else {
        document.querySelectorAll(".word.highlight").forEach(function(el) {
          el.classList.remove("highlight");
        });
        e.target.classList.add("highlight");
        var form_ids = parsedTextCtrl.getElementDataFormIds($el);
        var word_info = parseService.getWordInfo(form_ids);
        wordInfoCtrl.render(word_info);
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
    onClickToggleChartLevels: function(e) {
      textInfoCtrl.toggleChartLevels();
      textInfoCtrl.render();
    },
    clearAnalysis: function() {
      parsedTextCtrl.reset();
      textInfoCtrl.reset();
      wordInfoCtrl.reset();
      $("#analysis").addClass("d-none");
      return this;
    },
    colorReadability: function() {
      const checked = document.getElementById("increaseColorReadability").checked;
      if(checked) {
        theme.setTheme('colorblind');
      } else {
        theme.setDefaultTheme();
      }
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
    $(document).on('click', '#toggle-chart-levels', utils.logEvent(mainCtrl.onClickToggleChartLevels));
    if(window.location.hash == "#demo") {
      window.demo();
    }
  });

    // To run a demo, type demo() in your javascript console....
    window.demo = function() {
      document.querySelector("#textinput").value = `ПРЕСТУПЛЕНИЕ И НАКАЗАНИЕ
РОМАН В ШЕСТИ ЧАСТЯХ С ЭПИЛОГОМ
ЧАСТЬ ПЕРВАЯ

    В начале июля, в чрезвычайно жаркое время, под вечер, один молодой человек вышел из своей каморки, которую нанимал от жильцов в С — м переулке, на улицу и медленно, как бы в нерешимости, отправился к К — ну мосту.

    Он благополучно избегнул встречи с своею хозяйкой на лестнице. Каморка его приходилась под самою кровлей высокого пятиэтажного дома и походила более на шкаф, чем на квартиру. Квартирная же хозяйка его, у которой он нанимал эту каморку с обедом и прислугой, помещалась одною лестницей ниже, в отдельной квартире, и каждый раз, при выходе на улицу, ему непременно надо было проходить мимо хозяйкиной кухни, почти всегда настежь отворенной на лестницу. И каждый раз молодой человек, проходя мимо, чувствовал какое-то болезненное и трусливое ощущение, которого стыдился и от которого морщился. Он был должен кругом хозяйке и боялся с нею встретиться.

    Не то чтоб он был так труслив и забит, совсем даже напротив; но с некоторого времени он был в раздражительном и напряженном состоянии, похожем на ипохондрию. Он до того углубился в себя и уединился от всех, что боялся даже всякой встречи, не только встречи с хозяйкой. Он был задавлен бедностью; но даже стесненное положение перестало в последнее время тяготить его. Насущными делами своими он совсем перестал и не хотел заниматься. Никакой хозяйки, в сущности, он не боялся, что бы та ни замышляла против него. Но останавливаться на лестнице, слушать всякий вздор про всю эту обыденную дребедень, до которой ему нет никакого дела, все эти приставания о платеже, угрозы, жалобы, и при этом самому изворачиваться, извиняться, лгать, — нет уж, лучше проскользнуть как-нибудь кошкой по лестнице и улизнуть, чтобы никто не видал.
`;
    };

})(jQuery);
