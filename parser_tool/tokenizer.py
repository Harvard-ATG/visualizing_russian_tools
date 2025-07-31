# -*- coding: utf-8 -*-
import re
import unicodedata

import pygtrie

# Alphabet
RUS_ALPHABET_LIST = (
    "\u0410",
    "\u0430",  # Аа
    "\u0411",
    "\u0431",  # Бб
    "\u0412",
    "\u0432",  # Вв
    "\u0413",
    "\u0433",  # Гг
    "\u0414",
    "\u0434",  # Дд
    "\u0415",
    "\u0435",  # Ее
    "\u0401",
    "\u0451",  # Ёё
    "\u0416",
    "\u0436",  # Жж
    "\u0417",
    "\u0437",  # Зз
    "\u0418",
    "\u0438",  # Ии
    "\u0419",
    "\u0439",  # Йй
    "\u041a",
    "\u043a",  # Кк
    "\u041b",
    "\u043b",  # Лл
    "\u041c",
    "\u043c",  # Мм
    "\u041d",
    "\u043d",  # Нн
    "\u041e",
    "\u043e",  # Оо
    "\u041f",
    "\u043f",  # Пп
    "\u0420",
    "\u0440",  # Рр
    "\u0421",
    "\u0441",  # Сс
    "\u0422",
    "\u0442",  # Тт
    "\u0423",
    "\u0443",  # Уу
    "\u0424",
    "\u0444",  # Фф
    "\u0425",
    "\u0445",  # Хх
    "\u0426",
    "\u0446",  # Цц
    "\u0427",
    "\u0447",  # Чч
    "\u0428",
    "\u0448",  # Шш
    "\u0429",
    "\u0449",  # Щщ
    "\u042a",
    "\u044a",  # Ъъ
    "\u042b",
    "\u044b",  # Ыы
    "\u042c",
    "\u044c",  # Ьь
    "\u042d",
    "\u044d",  # Ээ
    "\u042e",
    "\u044e",  # Юю
    "\u042f",
    "\u044f",  # Яя
)
RUS_ALPHABET_SET = set(RUS_ALPHABET_LIST)
RUS_ALPHABET_STR = "".join(RUS_ALPHABET_LIST)

# Hyphens and dashes
HYPHEN_CHAR = "\u002d"  # Punctuation used to join components of a word
EN_DASH_CHAR = "\u2013"  # May be used interchangeably with hyphen or em-dash depending on context
EM_DASH_CHAR = "\u2014"  # Punctuation used to separate words in a sentence

# Quotation marks
QUOTE_ANGLE_LEFT = "\u00ab"
QUOTE_ANGLE_RIGHT = "\u00bb"
QUOTE_RAISED_LEFT = "\u201e"
QUOTE_RAISED_RIGHT = "\u201c"

# Punctuation list
RUS_PUNCT = (
    ".…,/#!?$%^&*;:{}=_`~[]()‘’“”'\"|"
    + QUOTE_ANGLE_LEFT
    + QUOTE_ANGLE_RIGHT
    + QUOTE_RAISED_LEFT
    + QUOTE_RAISED_RIGHT
    + EN_DASH_CHAR
    + EM_DASH_CHAR
    + HYPHEN_CHAR
)

# Diacritics
ACUTE_ACCENT = "\u00b4"  # Diacritic used to mark end-stress on russian words
COMBINING_ACCENT_CHAR = "\u0301"  # Diacritic used to mark stress on russian words
COMBINING_X_ABOVE = "\u033d"  # Diacritic used to mark stress on russian words (non-standard usage)
COMBINING_DIURESIS_CHAR = "\u0308"  # Diacritic used with the seventh letter of the russian alphabet (ё)
COMBINING_BREVE_CHAR = "\u0306"  # Diacritic used with the eleventh letter of the russian alphabet (й)

# Special cases where hyphenated words that should not be split up
# Word beginning with по- should also be privileged.
HYPHENATED_WORDS = (
    "Санкт-Петербург",
    "всё-таки",
    "все-таки",
    "из-за",
    "из-под",
    "во-первых",
    "во-вторых",
    "в-третьих",
    "в-четвёртых",
    "в-пятых",
    "в-шестых",
    "в-седьмых",
    "в-девятых",
    "где-нибудь",
    "где-то",
    "как-нибудь",
    "как-то",
    "какой-нибудь",
    "какой-то",
    "когда-нибудь",
    "когда-то",
    "кто-нибудь",
    "кто-то",
    "куда-нибудь",
    "куда-то",
    "наконец-то",
    "почему-нибудь",
    "почему-то",
    "что-нибудь",
    "что-то",
)

# Multi-word expressions
MWES = (
    "в будущем времени",
    "в настоящем времени",
    "в одиночку",
    "в приложении",
    "в прошедшем времени",
    "в течение",
    "во время",
    "вряд ли",
    "все равно",
    "всё равно",
    "до сих пор",
    "до того как",
    "до того, как",
    "добро пожаловать",
    "жду не дождусь",
    "жду, не дождусь",
    "за границей",
    "за границу",
    "и так далее",
    "и то и другое",
    "и то и то",
    "и то, и другое",
    "и то, и то",
    "из дома",
    "из дому",
    "из-за границы",
    "из-за того, что",
    "к сожалению",
    "к счастью",
    "как раз",
    "как следует",
    "как только",
    "между прочим",
    "на всякий случай",
    "на самом деле",
    "на связи",
    "не за что",
    "недалеко от",
    "несмотря на",
    "ни в коем случае",
    "ни за что",
    "перед тем как",
    "перед тем, как",
    "по Фаренгейту",
    "по Цельсию",
    "после того как",
    "после того, как",
    "потому что",
    "потому, что",
    "с тех пор",
    "с тех пор как",
    "с уважением",
    "с удовольствием",
    "так же",
    "так как",
    "так что",
    "только что",
)

# Translators
TRANSLATOR_PUNCT_REMOVE = str.maketrans("", "", RUS_PUNCT)
TRANSLATOR_DIACRITICS_REMOVE = str.maketrans("", "", COMBINING_ACCENT_CHAR + COMBINING_X_ABOVE + ACUTE_ACCENT)

# Regular expressions
RE_MATCH_DIGITS_ONLY = re.compile(r"^\d+$")
RE_MATCH_WHITESPACE_ONLY = re.compile(r"^\s+$")


def tokenize(text):
    """
    Returns a list of tokens.

    >>> tokenize("«Ко двору, — думает он. — Ко двору!»")
    ['«', 'Ко', ' ', 'двору', ',', ' ', '—', ' ', 'думает', ' ', 'он', '.', ' ', '—', ' ', 'Ко', ' ', 'двору', '!»']
    >>> tokenize("В не́которых ру́сских деревня́х по э́той техноло́гии вручну́ю де́лают матрёшек и сего́дня.")
    ['В', ' ', 'не́которых', ' ', 'ру́сских', ' ', 'деревня́х', ' ', 'по', ' ', 'э́той', ' ', 'техноло́гии', ' ', 'вручну́ю',
      ' ', 'де́лают', ' ', 'матрёшек', ' ', 'и', ' ', 'сего́дня', '.']
    >>> tokenize("в день по-весеннему свежий и по-летнему теплый…")
    ['в', ' ', 'день', ' ', 'по-весеннему', ' ', 'свежий', ' ', 'и', ' ', 'по-летнему', ' ', 'теплый', '…']
    >>> tokenize("A typical seventeen-year-old первоку́рсник | первоку́рсница (first-year student) "
    ... "in the филологи́ческий факульте́т (филфа́к) (Philology Faculty) has 23 па́ры")
    ['A', ' ', 'typical', ' ', 'seventeen', '-', 'year', '-', 'old', ' ', 'первоку́рсник', ' ', '|', ' ',
    'первоку́рсница', ' ', '(', 'first', '-', 'year', ' ', 'student', ')', ' ', 'in', ' ', 'the', ' ',
    'филологи́ческий', ' ', 'факульте́т', ' ', '(', 'филфа́к', ')', ' ', '(', 'Philology', ' ', 'Faculty', ')',
    ' ', 'has', ' ', '23', ' ', 'па́ры']
    >>> tokenize("ученик´ ученика́ ученике́ ученику́ ученико́м")
    ['ученик´', ' ', 'ученика́', ' ', 'ученике́', ' ', 'ученику́', ' ', 'ученико́м']
    >>> tokenize("э̽той техноло́гии")
    ['э̽той', ' ', 'техноло́гии']
    """
    return tokenize_multi_word_expressions(text)


def tokenize_words(text):
    """
    Returns a list of tokens that have been split into words, taking into account punctuation and hyphenation.
    """
    tokens = re.split(r"(\s+)", text)
    tokens = split_punctuation(tokens)
    tokens = split_hyphenated(tokens)
    return tokens


def tokenize_multi_word_expressions(text):
    """
    Returns a list of tokens split into words and merging multi-word expressions.
    """
    return merge_multi_word_expressions(tokenize_words(text))


def split_punctuation(tokens, punct=RUS_PUNCT, hyphen_char=HYPHEN_CHAR):
    """
    Splits punctuation except for hyphens, which require special treatment.
    """
    punct = punct.replace(hyphen_char, "")  # hyphens should be handled separately
    punct = punct.replace("[", "\\[").replace("]", "\\]")  # escaping for regex char class
    re_punct = re.compile("([%s]+)" % punct)
    new_tokens = []
    for token in tokens:
        if re_punct.search(token) is not None:
            for t in re_punct.split(token):
                if t != "":
                    new_tokens.append(t)
        else:
            if token != "":
                new_tokens.append(token)
    return new_tokens


def split_hyphenated(tokens, hyphen_char=HYPHEN_CHAR, reserved_words=HYPHENATED_WORDS):
    """
    Splits hyphenated tokens, handling special cases like "по-" words, which should not be split.
    """
    # Create a set of canonical forms of reserved words for faster lookup
    canonical_reserved_words = {canonical(word) for word in reserved_words}

    new_tokens = []
    for token in tokens:
        # split hyphenated unless it's a special case like "по-" words (DB entries for those)
        if hyphen_char in token and not token.lower().startswith("по-") and canonical(token) not in canonical_reserved_words:
            for t in re.split(r"(%s)" % hyphen_char, token):
                if t != "":
                    new_tokens.append(t)
        else:
            if token != "":
                new_tokens.append(token)
    return new_tokens


def merge_multi_word_expressions(tokens):
    """
    Merge multiple tokens that should be treated as a single unit (e.g. multiword expressions).

    >>> merge_multi_word_expressions(['это', ' ', 'только', ' ', 'потому', ',', ' ', 'что', ' ', 'боитесь', ' ', 'меня'])
    ['это', ' ', 'только', ' ', 'потому, что', ' ', 'боитесь', ' ', 'меня']
    >>> merge_multi_word_expressions(['потому', ' ', 'что', ' ', 'в', ' ', 'теплоте'])
    ['потому что', ' ', 'в', ' ', 'теплоте']
    """
    new_tokens = []
    i = 0
    while i < len(tokens):
        token = tokens[i]
        canonical_token = canonical(token)
        increment = 1
        if canonical_token != "" and MWE_TRIE.has_node(canonical_token):
            # start with highest n-gram first and work backwards
            num_tokens = MWE_MAXSIZE if MWE_MAXSIZE <= len(tokens) - i else len(tokens) - i
            while num_tokens > 0:
                mwe = "".join(tokens[i : i + num_tokens])
                canonical_mwe = canonical(mwe)
                if MWE_TRIE.has_key(canonical_mwe):
                    increment = num_tokens
                    token = mwe
                    break
                num_tokens -= 1
        new_tokens.append(token)
        i += increment
    return new_tokens


def tag(tokens):
    """
    Tag tokens with additional information.
    Returns an array of tuples: [(token1, index1, offset1, ...), (token2, index2, offset2, ...)]
    """
    tagged = []
    offset = 0
    for idx, token in enumerate(tokens):
        tagged.append(
            {"token": token, "index": idx, "offset": offset, "tokentype": tokentype(token), "canonical": canonical(token.strip())}
        )
        offset += len(token)
    print("tagged", tagged)
    return tagged


def tokenize_and_tag(text):
    """
    Convenience function for tagging and tokenizing text.
    """
    return tag(tokenize(text))


def normalize_hyphens(token):
    """
    Normalizes hyphens.
    """
    return token.replace(EN_DASH_CHAR, HYPHEN_CHAR)


def unicode_decompose(token):
    """
    Decomposes the unicode string into NFKD form (e.g. separate combining accents, diacritics, etc).
    """
    return unicodedata.normalize("NFKD", token)


def unicode_compose(token):
    """
    Composes the unicode string so it is the canonical composition (eliminate combining characters).
    """
    return unicodedata.normalize("NFKC", token)


def strip_punctuation(token):
    """
    Removes all punctuation from text.
    """
    return token.translate(TRANSLATOR_PUNCT_REMOVE)


def strip_diacritics(token):
    """
    Removes diacritics from text.
    """
    return token.translate(TRANSLATOR_DIACRITICS_REMOVE)


def canonical(token):
    """
    Returns the canonical text stripped of all punctuation and diacritics and
    in the canonical unicode composition (NFKC).

    This is intended to be used for doing lookups of words against the database.
    """
    # normalizing text case and hyphenation
    token = token.lower()
    token = normalize_hyphens(token)

    # remove diacritics in 2 passes, first removing standalone diacritics such as acute accents
    # indicating end-stress, and then decomposing to remove any combining diacritics
    token = strip_diacritics(token)
    token = unicode_compose(strip_diacritics(unicode_decompose(token)))

    return token


TOKEN_PUNCT = "PUNCT"
TOKEN_SPACE = "SPACE"
TOKEN_NUM = "NUM"
TOKEN_WORD = "WORD"
TOKEN_RUS = "RUS"


def tokentype(text):
    """
    Classifies a token as whitespace (SPACE), punctuation (PUNCT), numeric (NUM),
    word (WORD), or a russian word (RUS). Note that the difference between a word
    and a russian word is merely the alphabet used. This is a simple heuristic to
    to guide lemmatization.

    >>> tokentype('—')
    'PUNCT'
    >>> tokentype('123')
    'NUM'
    >>> tokentype("find")
    'WORD'
    >>> tokentype("найти")
    'RUS'
    """
    tokentype = None
    if is_whitespace(text):
        tokentype = TOKEN_SPACE
    elif is_punctuation(text):
        tokentype = TOKEN_PUNCT
    else:
        canonical_text = canonical(text.strip())
        if is_russian(canonical_text):
            tokentype = TOKEN_RUS
        elif is_numeric(canonical_text):
            tokentype = TOKEN_NUM
        else:
            tokentype = TOKEN_WORD
    return tokentype


def is_russian(token):
    """
    Returns true if the token contains only russian characters or punctuation, otherwise false.
    """
    return any([c in RUS_ALPHABET_SET for c in token])


def is_punctuation(token):
    return all([c in RUS_PUNCT for c in token])


def is_whitespace(token):
    return RE_MATCH_WHITESPACE_ONLY.match(token) is not None


def is_numeric(token):
    return token.isdigit()


def is_equal(text1, text2):
    return unicode_decompose(text1) == unicode_decompose(text2)


def _make_trie(mwes=None):
    """
    Creates a Trie of multi-word expressions for fast lookups.
    Returns the trie and the maximum size of any token in that trie.

    Notes:
        - The MWEs are tokenized in the standard way
        - The MWEs are added to the trie in "canonical" form (e.g. lowercase, etc)
    """
    trie = pygtrie.CharTrie()
    if mwes is None:
        return trie

    mwe_maxsize = 0
    for mwe in mwes:
        tokens = tokenize_words(mwe)
        mwe_maxsize = max(len(tokens), mwe_maxsize)
        trie[canonical(mwe)] = True

    return trie, mwe_maxsize


MWE_TRIE, MWE_MAXSIZE = _make_trie(MWES)
