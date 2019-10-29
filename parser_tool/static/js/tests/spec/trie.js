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
    })
  });


});
