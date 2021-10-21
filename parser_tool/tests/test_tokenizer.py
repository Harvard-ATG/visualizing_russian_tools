# -*- coding: utf-8 -*-
import unittest

from parser_tool import tokenizer


class TestTokenizer(unittest.TestCase):
    def test_tokenize_sentence_unaccented(self):
        text = 'Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему.\n\n'
        expected_tokens = ['Все', ' ', 'счастливые', ' ', 'семьи', ' ', 'похожи', ' ', 'друг', ' ', 'на', ' ', 'друга', ',', ' ', 'каждая', ' ', 'несчастливая', ' ', 'семья', ' ', 'несчастлива', ' ', 'по-своему', '.', '\n\n']
        actual_tokens = tokenizer.tokenize(text)
        self.assertEqual(expected_tokens, actual_tokens)
        self.assertEqual(text, ''.join(actual_tokens))

    def test_tokenize_sentence_accented(self):
        text = 'Жила́-была́ на све́те лягу́шка-кваку́шка.'
        expected_tokens = ['Жила́', '-', 'была́', ' ', 'на', ' ', 'све́те', ' ', 'лягу́шка', '-', 'кваку́шка', '.']
        actual_tokens = tokenizer.tokenize(text)
        self.assertEqual(expected_tokens, actual_tokens)
        self.assertEqual(text, ''.join(actual_tokens))

    def test_tokenize_sentence_with_end_stressed_word(self): 
        text = 'Только его отец´ разговаривал за столом.'
        expected_tokens = ['Только', ' ', 'его', ' ', 'отец´', ' ', 'разговаривал', ' ', 'за', ' ', 'столом', '.']
        actual_tokens = tokenizer.tokenize(text)
        self.assertEqual(expected_tokens, actual_tokens)
        self.assertEqual(text, ''.join(actual_tokens))

    def test_tokenize_sentence_with_numbers(self):
        text = 'НАСА, высота 82,7 км'
        expected_tokens = ['НАСА', ',', ' ', 'высота', ' ', '82', ',', '7', ' ', 'км']
        actual_tokens = tokenizer.tokenize(text)
        self.assertEqual(expected_tokens, actual_tokens)
        self.assertEqual(text, ''.join(actual_tokens))

    def test_tokenize_sentence_with_accented_and_hyphenated(self):
        text = "све́те лягу́шка-кваку́шка.\n"
        expected_tokens = ['све́те', ' ', 'лягу́шка', '-', 'кваку́шка', '.', '\n']
        actual_tokens = tokenizer.tokenize(text)
        self.assertEqual(expected_tokens, actual_tokens)
        self.assertEqual(text, ''.join(actual_tokens))

    def test_tokenize_sentence_russian(self):
        text = 'А если же я и провела хорошо каникулы, так это потому, что занималась наукой и вела себя хорошо.'
        expected_tokens = ['А', ' ', 'если', ' ', 'же', ' ', 'я', ' ', 'и', ' ', 'провела', ' ', 'хорошо', ' ', 'каникулы', ',', ' ', 'так', ' ', 'это', ' ', 'потому, что', ' ', 'занималась', ' ', 'наукой', ' ', 'и', ' ', 'вела', ' ', 'себя', ' ', 'хорошо', '.']
        actual_tokens = tokenizer.tokenize(text)
        self.assertEqual(expected_tokens, actual_tokens)
        self.assertEqual(text, ''.join(actual_tokens))

    def test_tokenize_sentence_with_multi_word_expression(self):
        tests = [
            {
                'mwe': 'потому, что',
                'text': 'это только потому, что боитесь меня',
                'occurrences': 1,
            },
            {
                'mwe': 'потому что',
                'text': 'Не вспомнила, потому что не вспоминается...',
                'occurrences': 1,
            },
            {
                'mwe': 'Потому что',
                'text': 'Потому что была война...',
                'occurrences': 1,
            },
            {
                'mwe': 'и то и другое',
                'text': 'Из-за холода они быстро теряли и то и другое',
                'occurrences': 1,
            },
            {
                'mwe': 'и то, и другое',
                'text': 'Вместе и то, и другое длилось 12 лет и 7 месяцев.',
                'occurrences': 1,
            },
            {
                'mwe': 'на самом деле',
                'text': 'А как на самом деле?',
                'occurrences': 1,
            },
            {
                'mwe': 'НА САМОМ ДЕЛЕ',
                'text': 'А КАК НА САМОМ ДЕЛЕ?',
                'occurrences': 1,
            },
            {
                'mwe': 'На самом деле',
                'text': 'На самом деле я закрою за тобою дверь Осень, прощай.',
                'occurrences': 1,
            },
            {
                'mwe': 'на самом деле',
                'text': 'Он стоял на гранитной площадке почти на самом берегу моря.',
                'occurrences': 0,
            },
            {
                'mwe': 'С тех пор',
                'text': 'С тех пор узнаёт он в любом!',
                'occurrences': 1,
            },
            {
                'mwe': 'Во время',
                'text': 'Во время встречи он встал и вышел в коридор. В это время мы еще не поняли, в чем дело.',
                'occurrences': 1,
            }
        ]
        for test in tests:
            (mwe, text, expected_occurrences) = test['mwe'], test['text'], test['occurrences']
            actual_tokens = tokenizer.tokenize(text)
            if expected_occurrences == 0:
                self.assertNotIn(mwe, actual_tokens)
            else:
                self.assertIn(mwe, actual_tokens)
            self.assertEqual(expected_occurrences, len([t for t in actual_tokens if t == mwe]))

    def test_tokenizer_sentence_with_mixed_english_and_punctuation(self):
        text = "A typical seventeen-year-old первоку́рсник | первоку́рсница (first-year student) in the филологи́ческий факульте́т (филфа́к) (Philology Faculty) has 23 па́ры"
        expected_tokens = ['A', ' ', 'typical', ' ', 'seventeen', '-', 'year', '-', 'old', ' ', 'первоку́рсник', ' ', '|', ' ', 'первоку́рсница', ' ', '(', 'first', '-', 'year', ' ', 'student', ')', ' ', 'in', ' ', 'the', ' ', 'филологи́ческий', ' ', 'факульте́т', ' ', '(', 'филфа́к', ')', ' ', '(', 'Philology', ' ', 'Faculty', ')', ' ', 'has', ' ', '23', ' ', 'па́ры']
        actual_tokens = tokenizer.tokenize(text)
        self.assertEqual(expected_tokens, actual_tokens)
        self.assertEqual(text, ''.join(actual_tokens))

    def test_tokenizer_regressions(self):
        tests = [
            {
                'text': "«Ко двору, — думает он. — Ко двору!»",
                'tokens': ['«', 'Ко', ' ', 'двору', ',', ' ', '—', ' ', 'думает', ' ', 'он', '.', ' ', '—', ' ', 'Ко', ' ', 'двору', '!»'],
            },
            {
                'text': "В не́которых ру́сских деревня́х по э́той техноло́гии вручну́ю де́лают матрёшек и сего́дня.",
                'tokens': ['В', ' ', 'не́которых', ' ', 'ру́сских', ' ', 'деревня́х', ' ', 'по', ' ', 'э́той', ' ', 'техноло́гии', ' ', 'вручну́ю', ' ', 'де́лают', ' ', 'матрёшек', ' ', 'и', ' ', 'сего́дня', '.'],
            },
            {
                'text': "ученик´ ученика́ ученике́ ученику́ ученико́м",
                'tokens': ['ученик´', ' ', 'ученика́', ' ', 'ученике́', ' ', 'ученику́', ' ', 'ученико́м'],
            },
            {
                'text': "э̽той техноло́гии",
                'tokens': ['э̽той', ' ', 'техноло́гии'],
            }
        ]
        for test in tests:
            (text, expected_tokens) = test['text'], test['tokens']
            self.assertEqual(expected_tokens, tokenizer.tokenize(text))


class TestTokenizerHelpers(unittest.TestCase):
    def test_strip_diacritics(self):
        tests = [
            {
                "accented": 'све́те',
                "unaccented": 'свете'
            },
            {
                "accented": 'любо́вь',
                "unaccented": 'любовь'
            },
            {
                "accented": 'вещество́',
                "unaccented": 'вещество'
            },
            {
                "accented": 'мото́р',
                "unaccented": 'мотор'
            },
            {
                "accented": "отец´",
                "unaccented": "отец"
            },
            {
                "accented": "В не́которых ру́сских деревня́х по э́той техноло́гии вручну́ю де́лают матрёшек и сего́дня.",
                "unaccented": 'В некоторых русских деревнях по этой технологии вручную делают матрёшек и сегодня.'
            },
        ]
        for test in tests:
            (accented, unaccented) = test['accented'], test['unaccented']
            self.assertEqual(unaccented, tokenizer.strip_diacritics(accented))

    def test_split_hyphenated(self):
        tests = [
            {
                "tokens": ['по-весеннему'],
                "expected": ['по-весеннему']
            },
            {
                "tokens": ['француженкою-гувернанткой'],
                "expected": ['француженкою', '-', 'гувернанткой']
            },
            {
                "tokens": ['seventeen-year-old'],
                "expected": ['seventeen', '-', 'year', '-', 'old']
            },
        ]
        for test in tests:
            (tokens, expected) = test['tokens'], test['expected']
            self.assertEqual(expected, tokenizer.split_hyphenated(tokens))

    def test_split_punctuation(self):
        tests = [
            {
                "tokens": ["фрукты=яблоко|вишня"],
                "expected": ['фрукты', '=', 'яблоко', '|', 'вишня']
            },
            {
                "tokens": ["(13  мая  1876)"],
                "expected": ['(', '13  мая  1876', ')']
            },
            {
                "tokens": ["(Students", " ", "and", "Faculty)."],
                "expected": ['(', 'Students', ' ', 'and', 'Faculty', ').']
            }
        ]
        for test in tests:
            (tokens, expected) = test['tokens'], test['expected']
            self.assertEqual(expected, tokenizer.split_punctuation(tokens))

    def test_canonical(self):
        tests = [
            {
                "token": "све́те",
                "expected": "свете"
            },
            {
                "token": "отец´",
                "expected": "отец"
            }
        ]
        for test in tests:
            token, expected = test['token'], test['expected']
            self.assertEqual(expected, tokenizer.canonical(token))

    def test_tokentype(self):
        tests = [
            ("найти", tokenizer.TOKEN_RUS),
            ("не́которых", tokenizer.TOKEN_RUS),
            ("по-русски", tokenizer.TOKEN_RUS),
            ("english", tokenizer.TOKEN_WORD),
            ("students", tokenizer.TOKEN_WORD),
            ("(", tokenizer.TOKEN_PUNCT),
            (".", tokenizer.TOKEN_PUNCT),
            ("1992", tokenizer.TOKEN_NUM),
            ("\n\r", tokenizer.TOKEN_SPACE),
            (" ", tokenizer.TOKEN_SPACE),
        ]
        for test in tests:
            (token, expected) = test
            self.assertEqual(expected, tokenizer.tokentype(token))

    def test_tag(self):
        tests = [
            {
                "tokens": ['Ко', 'двору'],
                "tagged": [
                    {'token': 'Ко', 'index': 0, 'offset': 0, 'tokentype': 'RUS', 'canonical': 'ко'},
                    {'token': 'двору', 'index': 1, 'offset': 2, 'tokentype': 'RUS', 'canonical': 'двору'}
                ]
            },
            {
                "tokens": ['100', '!'],
                "tagged": [
                    {'token': '100', 'index': 0, 'offset': 0, 'tokentype': 'NUM', 'canonical': '100'},
                    {'token': '!', 'index': 1, 'offset': 3, 'tokentype': 'PUNCT', 'canonical': '!'}
                ]
            }
        ]
        for test in tests:
            (tokens, tagged) = test['tokens'], test['tagged']
            self.assertEqual(tagged, tokenizer.tag(tokens))


if __name__ == '__main__':
    unittest.main()
