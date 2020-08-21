describe("trie suite", function() {
  const LemmaTrie = window.app.LemmaTrie;

  describe("LemmaTrie constructor", function() {
      it("constructor should exist", function() {
        expect(typeof LemmaTrie).toBe("function");
        expect(LemmaTrie.name).toBe("LemmaTrie");
      });
      it("constructor should create a new instance with an empty root", function() {
        const trie = new LemmaTrie();
        expect(trie.hasOwnProperty("root"));
        expect(typeof trie.root).toBe("object");
        [['key', 'string'], ['children', 'object']].forEach(([prop, prop_type]) => {
          expect(trie.root.hasOwnProperty(prop)).toBe(true);
          expect(typeof trie.root[prop]).toBe(prop_type);
        });
        expect(Object.keys(trie.root.children).length).toBe(0);
      })
  });

  describe("LemmaTrie normalize", function() {
    it("should strip diacritics except for ё (yo) and й (yot)", function() {
      const trie = new LemmaTrie();
      const tests = [
        {key: "не́которых", expected: "некоторых"},
        {key: "вещество́", expected: "вещество"},
        {key: "трёх", expected: "трёх"},
        {key: "сёрфинги́ст", expected: "сёрфингист"},
        {key: "синий", expected: "синий"},
      ];
      tests.forEach((test) => {
        const normalized = trie.normalize(test.key);
        const expected = test.expected.normalize("NFD");
        expect(normalized).toBe(expected);
      });
    });
    it("should lowercase words", function() {
      const trie = new LemmaTrie();
      const tests = [
        {key: "Вчера", expected: "Вчера"},
        {key: "Каждый", expected: "Каждый"}
      ];
      tests.forEach((test) => {
        const normalized = trie.normalize(test.key);
        const expected = test.expected.normalize("NFD").toLowerCase();
        expect(normalized).toBe(expected);
      });
    });
  });

  describe("LemmaTrie insert and find", function() {
    it("should be able to find words that have been inserted", function() {
      const trie = new LemmaTrie();
      const words = ['быть', 'потом', 'пешком', 'иногда', 'работе', 'работа', 'работу', 'работал'];

      words.forEach((w) => {
        [depth, node] = trie.insert(w);
        expect(depth).not.toBe(0);
        expect(typeof node).toBe("object");
        ["key", "children"].forEach((prop) => expect(node.hasOwnProperty(prop)).toBe(true));
      });

      found_words = [];
      words.forEach((w) => {
        [depth, node] = trie.find(w);
        expect(depth).not.toBe(-1);
        expect(typeof node).toBe("object");
        if(depth !== -1) {
          found_words.push(w);
        }
      });
      expect(found_words).toEqual(words);
    });

    it("should be able to associate a value with a word", function() {
      const trie = new LemmaTrie();
      let inserts = [
        {
          "key": "работу",
          "value": {"type": "form", "id": 2070}
        },
        {
          "key": "работа",
          "value": {"type": "lemma", "id": 133}
        }
      ];

      inserts.forEach((insert) => {
        trie.insert(insert.key, insert.value)
      });

      inserts.forEach((insert) => {
        [depth, node] = trie.find(insert.key);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(node.hasOwnProperty("value"));
        expect(Array.isArray(node.value)).toBe(true);
        expect(node.value).toEqual([insert.value]);
      });
    });

    it("should be able to insert list of words", function() {
      const trie = new LemmaTrie();
      let words = [
        'бакала́вра',
        'бу́лочка',
        'вопроси́тельно',
        'вопроси́тельный',
        'воспи́танный',
        'воспи́тывать',
        'воспита́ние',
        'воспита́ть',
        'воспомина́ние',
        'вуз',
        'вы́сший',
        'вы́учить',
        'выпускно́й',
        'дипло́м',
        'дипло́мная',
        'до́ктор',
        'до́кторская',
        'докла́д',
        'доктора́нт',
        'дополни́тельно',
        'дополни́тельное',
        'дополни́тельный',
        'дру́жба',
        'дружи́ть',
        'заведе́ние',
        'занима́ться',
        'заня́ться',
        'запи́ска',
        'запи́сываться',
        'записа́ться',
        'запо́мнить',
        'запомина́ть',
        'зарегистри́роваться',
        'зачёт',
        'зна́ние',
        'знако́мить',
        'знако́мство',
        'зооло́гия',
        'изуча́ть',
        'изуче́ние',
        'изучи́ть',
        'инжене́рия',
        'испра́вить',
        'испра́виться',
        'исправля́ть',
        'исправля́ться',
        'кандида́т',
        'культу́рно',
        'культу́рный',
        'курси́в',
        'лист´',
        'листы́',
        'ма́ркер',
        'маги́стра',
        'магистра́нт',
        'магистрату́ра',
        'наизу́сть',
        'нау́к',
        'нау́чно',
        'нау́чный',
        'начина́ющий',
        'не́ту',
        'незачёт',
        'неку́льтурно',
        'некульту́рный',
        'непро́сто',
        'непросто́й',
        'неторопли́вый',
        'но́жницы',
        'образо́ванный',
        'образова́ние',
        'обуче́ние',
        'объясни́ться',
        'объясня́ться',
        'однокла́ссник',
        'однокла́ссница',
        'ока́нчивать',
        'око́нчить',
        'оконча́ние',
        'отделе́ние',
        'отли́чник',
        'отли́чница',
        'оце́нивать',
        'оце́ниваться',
        'оцени́ть',
        'оцени́ться',
        'ошиба́ться',
        'ошиби́ться',
        'педаго́гика',
        'по́черк',
        'повторе́ние',
        'повтори́тельное',
        'подру́га',
        'подру́жка',
        'подружи́ться',
        'познако́мить',
        'политоло́гия',
        'понима́ние',
        'поторопи́ть',
        'поторопи́ться',
        'предста́виться',
        'представля́ться',
        'про́пуск',
        'прове́рить',
        'прове́рка',
        'проверя́ть',
        'рабо́та',
        'разреша́ть',
        'разреши́ть',
        'разу́чиваться',
        'разучи́ться',
        'регистри́роваться',
        'сло́жно',
        'сло́жный',
        'специали́ст',
        'сте́пень',
        'това́рищ',
        'торопи́ть',
        'торопи́ться',
        'у́мница',
        'у́ровень',
        'университе́тский',
        'уче́бное',
        'уче́бный',
        'учени́ца',
        'ученик´',
        'хо́лл',
        'шко́льный',
        'экспе́рт'
      ];
      words.forEach((word, index) => trie.insert(word, index));
      words.forEach((word, index) => {
        [depth, node] = trie.find(word);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(node.value)).toBe(true);
        expect(node.value).toEqual([index]);
      });
    });
  });


});
