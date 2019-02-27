# -*- coding: utf-8 -*-
import unittest
from parser_tool import tokenizer

class TestTokenizer(unittest.TestCase):
    def test_strip_diacritics(self):
        tests = [
            ['све́те', 'свете'],
            ['любо́вь', 'любовь'],
            ['вещество́', 'вещество'],
            ['мото́р', 'мотор'],
        ]
        for test in tests:
            (accented, unaccented) = test
            self.assertEqual(unaccented, tokenizer.strip_diacritics(accented))

    def test_tokenize_sentence_unaccented(self):
        text = 'Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему.\n\n'
        expected_tokens = ['Все', ' ', 'счастливые', ' ', 'семьи', ' ', 'похожи', ' ', 'друг', ' ', 'на', ' ', 'друга,', ' ', 'каждая', ' ', 'несчастливая', ' ', 'семья', ' ', 'несчастлива', ' ', 'по-своему.', '\n\n', '']
        actual_tokens = tokenizer.tokenize(text)
        self.assertEqual(expected_tokens, actual_tokens)

    def test_tokenize_sentence_accented(self):
        text = 'Жила́-была́ на све́те лягу́шка-кваку́шка.'
        expected_tokens = ['Жила́', '-', 'была́', ' ', 'на', ' ', 'све́те', ' ', 'лягу́шка', '-', 'кваку́шка.']
        actual_tokens = tokenizer.tokenize(text)
        self.assertEqual(expected_tokens, actual_tokens)

    def test_tokenize_sentence_with_numbers(self):
        text = 'НАСА, высота 82,7 км'
        expected_tokens = ['НАСА,', ' ', 'высота', ' ', '82,7', ' ', 'км']
        actual_tokens = tokenizer.tokenize(text)
        self.assertEqual(expected_tokens, actual_tokens)

    def test_tokenize_sentence_with_accented_and_hyphenated(self):
        text = "све́те лягу́шка-кваку́шка.\n"
        tokens = tokenizer.tokenize(text)
        self.assertEqual('све́те', tokens[0])
        self.assertEqual(' ', tokens[1])
        self.assertEqual('лягу́шка-кваку́шка.', "".join(tokens[2:5]))
        self.assertEqual("", tokens[6])

    def test_tokenize_reconstruct_text(self):
        text = 'А если же я и провела хорошо каникулы, так это потому, что занималась наукой и вела себя хорошо.'
        tokens = tokenizer.tokenize(text)
        reconstructed_text = ''.join(tokens)
        self.assertEqual(text, reconstructed_text)


if __name__ == '__main__':
    unittest.main()