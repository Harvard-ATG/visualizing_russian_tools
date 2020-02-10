describe("lemmatization suite", function() {
  const LemmatizedText = window.app.LemmatizedText;

  const FIXTURE_TEXT_STRING = "Это же не первый раз в первый класс."; // => It's not the first day of school.
  const FIXTURE_TEXT_LEMMATIZED = { // simplified output from API
    "lemmas": {
      "2": {
        "id": 2,
        "label": "в",
        "translation": "in; into; to; at",
        "level": "1E"
      },
      "3": {
        "id": 3,
        "label": "не",
        "translation": "not",
        "level": "1E"
      },
      "12": {
        "id": 12,
        "label": "это",
        "translation": "this is",
        "level": "1E"
      },
      "28": {
        "id": 28,
        "label": "этот",
        "translation": "this; that",
        "level": "1E"
      },
      "69": {
        "id": 69,
        "label": "раз",
        "translation": "time; occurrence; one (counting)",
        "level": "1E"
      },
      "76": {
        "id": 76,
        "label": "первый",
        "translation": "1st; first",
        "level": "1E"
      },
      "79": {
        "id": 79,
        "label": "во",
        "translation": "in; into; to; at",
        "level": "1E"
      },
      "456": {
        "id": 456,
        "label": "класс",
        "translation": "classroom; grade (in school)",
        "level": "1E"
      },
      "457": {
        "id": 457,
        "label": "класс",
        "translation": "cool!",
        "level": "1E"
      },
      "1885": {
        "id": 1885,
        "label": "же",
        "translation": "(emphatic particle)",
        "level": "2I"
      }
    },
    "forms": {
      "2": {
        "id": 2,
        "type": "preposition",
        "label": "в",
        "lemma_id": 2
      },
      "4": {
        "id": 4,
        "type": "function",
        "label": "не",
        "lemma_id": 3
      },
      "120": {
        "id": 120,
        "type": "pronoun",
        "label": "это",
        "lemma_id": 12
      },
      "232": {
        "id": 232,
        "type": "nNOMsg",
        "label": "это",
        "lemma_id": 28
      },
      "233": {
        "id": 233,
        "type": "nACCsg",
        "label": "это",
        "lemma_id": 28
      },
      "758": {
        "id": 758,
        "type": "NOMsg",
        "label": "раз",
        "lemma_id": 69
      },
      "759": {
        "id": 759,
        "type": "ACCsg",
        "label": "раз",
        "lemma_id": 69
      },
      "766": {
        "id": 766,
        "type": "GENpl",
        "label": "раз",
        "lemma_id": 69
      },
      "971": {
        "id": 971,
        "type": "mNOMsg",
        "label": "первый",
        "lemma_id": 76
      },
      "973": {
        "id": 973,
        "type": "mACCsgIN",
        "label": "первый",
        "lemma_id": 76
      },
      "1005": {
        "id": 1005,
        "type": "preposition",
        "label": "в",
        "lemma_id": 79
      },
      "9587": {
        "id": 9587,
        "type": "NOMsg",
        "label": "класс",
        "lemma_id": 456
      },
      "9588": {
        "id": 9588,
        "type": "ACCsg",
        "label": "класс",
        "lemma_id": 456
      },
      "9599": {
        "id": 9599,
        "type": "discourse",
        "label": "класс",
        "lemma_id": 457
      },
      "37296": {
        "id": 37296,
        "type": "miscellaneous",
        "label": "же",
        "lemma_id": 1885
      }
    },
    "tokens": [
      {
        "token": "Это",
        "index": 0,
        "offset": 0,
        "tokentype": "RUS",
        "canonical": "это",
        "form_ids": [
          120,
          232,
          233
        ],
        "level": "1E"
      },
      {
        "token": " ",
        "index": 1,
        "offset": 3,
        "tokentype": "SPACE",
        "canonical": "",
        "form_ids": [],
        "level": ""
      },
      {
        "token": "же",
        "index": 2,
        "offset": 4,
        "tokentype": "RUS",
        "canonical": "же",
        "form_ids": [
          37296
        ],
        "level": "2I"
      },
      {
        "token": " ",
        "index": 3,
        "offset": 6,
        "tokentype": "SPACE",
        "canonical": "",
        "form_ids": [],
        "level": ""
      },
      {
        "token": "не",
        "index": 4,
        "offset": 7,
        "tokentype": "RUS",
        "canonical": "не",
        "form_ids": [
          4
        ],
        "level": "1E"
      },
      {
        "token": " ",
        "index": 5,
        "offset": 9,
        "tokentype": "SPACE",
        "canonical": "",
        "form_ids": [],
        "level": ""
      },
      {
        "token": "первый",
        "index": 6,
        "offset": 10,
        "tokentype": "RUS",
        "canonical": "первый",
        "form_ids": [
          971,
          973
        ],
        "level": "1E"
      },
      {
        "token": " ",
        "index": 7,
        "offset": 16,
        "tokentype": "SPACE",
        "canonical": "",
        "form_ids": [],
        "level": ""
      },
      {
        "token": "раз",
        "index": 8,
        "offset": 17,
        "tokentype": "RUS",
        "canonical": "раз",
        "form_ids": [
          758,
          759,
          766
        ],
        "level": "1E"
      },
      {
        "token": " ",
        "index": 9,
        "offset": 20,
        "tokentype": "SPACE",
        "canonical": "",
        "form_ids": [],
        "level": ""
      },
      {
        "token": "в",
        "index": 10,
        "offset": 21,
        "tokentype": "RUS",
        "canonical": "в",
        "form_ids": [
          2,
          1005
        ],
        "level": "1E"
      },
      {
        "token": " ",
        "index": 11,
        "offset": 22,
        "tokentype": "SPACE",
        "canonical": "",
        "form_ids": [],
        "level": ""
      },
      {
        "token": "первый",
        "index": 12,
        "offset": 23,
        "tokentype": "RUS",
        "canonical": "первый",
        "form_ids": [
          971,
          973
        ],
        "level": "1E"
      },
      {
        "token": " ",
        "index": 13,
        "offset": 29,
        "tokentype": "SPACE",
        "canonical": "",
        "form_ids": [],
        "level": ""
      },
      {
        "token": "класс",
        "index": 14,
        "offset": 30,
        "tokentype": "RUS",
        "canonical": "класс",
        "form_ids": [
          9587,
          9588,
          9599
        ],
        "level": "1E"
      },
      {
        "token": ".",
        "index": 15,
        "offset": 35,
        "tokentype": "PUNCT",
        "canonical": ".",
        "form_ids": [],
        "level": ""
      }
    ]
  };

  describe("LemmatizedText constructor", function() {
    it("constructor should exist", function() {
      expect(typeof LemmatizedText).toBe("function");
      expect(LemmatizedText.name).toBe("LemmatizedText");
    });
    it("constructor should create a new instance with empty data", function() {
      let lemmatized_text = new LemmatizedText();
      expect(lemmatized_text.empty()).toBe(true);
    });
    it("constructor should create a new instance witih data (non-empty)", function() {
      let lemmatized_text = new LemmatizedText(FIXTURE_TEXT_LEMMATIZED);
      expect(lemmatized_text.empty()).toBe(false);
    });
  });

  describe("LemmatizedText data retrieval methods", function() {
    it("tokens", function() {
      let data = FIXTURE_TEXT_LEMMATIZED;
      let lemmatized_text = new LemmatizedText(data);
      let actual = lemmatized_text.tokens();
      let expected = data.tokens.map(o => o.token);
      expect(actual).toEqual(expected);
    });
    it("words", function() {
      let data = FIXTURE_TEXT_LEMMATIZED;
      let lemmatized_text = new LemmatizedText(data);
      let actual = lemmatized_text.words();
      let expected = data.tokens.filter(o => o.tokentype == "RUS").map(o => o.token);
      expect(actual).toEqual(expected);
    });
    it("wordsLemmatized", function() {
      let data = FIXTURE_TEXT_LEMMATIZED;
      let lemmatized_text = new LemmatizedText(data);
      let actual = lemmatized_text.wordsLemmatized();
      let expected = data.tokens.filter(o => o.tokentype == "RUS" && o.form_ids.length > 0).map(o => o.token);
      expect(actual).toEqual(expected);
    });
    it("wordsNotLemmatized", function() {
      let data = FIXTURE_TEXT_LEMMATIZED;
      let lemmatized_text = new LemmatizedText(data);
      let actual = lemmatized_text.wordsNotLemmatized();
      let expected = data.tokens.filter(o => o.tokentype == "RUS" && o.form_ids.length == 0).map(o => o.token);
      expect(actual).toEqual(expected);
    });
    it("lemmas", function() {
      let data = FIXTURE_TEXT_LEMMATIZED;
      let lemmatized_text = new LemmatizedText(data);
      let actual = lemmatized_text.lemmas();
      let expected = Object.values(data.lemmas).map(o => o.label);
      expected.sort((a, b) => a.localeCompare(b), "ru-RU", {sensitivity: "base", ignorePunctuation: true});
      expect(actual).toEqual(expected);
    });
    it("vocab", function() {
      let data = FIXTURE_TEXT_LEMMATIZED;
      let lemmatized_text = new LemmatizedText(data);
      let actual = lemmatized_text.vocab();
      let expected_tokens = data.tokens.filter(o => o.tokentype == "RUS").map(o => o.token);
      let expected_unique = [...new Set(expected_tokens)]; 
      expected_unique.sort((a,b) => a.localeCompare(b, "ru-RU", {sensitivity:"base"}));
      expect(actual).toEqual(expected_unique);
    });
  });
});
