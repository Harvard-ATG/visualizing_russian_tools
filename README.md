![Coverage Status](./coverage.svg)

# Visualizing Russian Tools

Visualizing Russian is a suite of web-based tools for language learners, researchers, and teachers.

https://visualizingrussian.fas.harvard.edu/

![Visible Vocabulary](docs/img/visiblevocabulary.png)

## Getting Started

```
python -m venv .venv # Uses python 3.11 from .python-version
source .venv/bin/activate
pip install -r requirements.txt
./manage.py migrate
./manage.py import_clancy_sqldump
./manage.py build_annoy_forest
./manage.py runserver --nostatic
```

Install pre-commit hooks (`.pre-commit-config.yaml`):

```
pre-commit install
```

Using docker:

```
docker build . -t visualizing_russian_tools
docker run -p 8000:8000 visualizing_russian_tools
```

Or with Docker Compose:

```
docker compose up
```

## Source Data

The data for this project is primarily sourced from a spreadsheet created and maintained by Steven Clancy. Since the spreadsheet is updated regularly, there is a process to update the database that involves converting the Excel spreadsheet to a CSV and then building a SQL database from scratch. The database is then loaded with related information obtained from the RNC and other sources. Since the data is read-only, a simple SQLite database is sufficient.

Key points:
- The source data comes from a spreadsheet created and maintained by Steven Clancy.
- The spreadsheet must be converted and imported into a [SQLite database](https://www.sqlite.org/index.html).
- The database is dumped to a SQL file and stored in the repository.

To update the database from the latest version of the spreadsheet:
Note: This also includes updates to `Lemma` table columns with `icon_urls`, `icon_license`, `icon_attribute` with data from `icons.csv` file
```
$ ./manage.py convert_clancy_xls --xlsfile NewVisualizingRussian.xls --csvfile russian.csv
$ ./manage.py create_clancy_db --csvfile russian.csv --dbfile russian.sqlite3
$ ./manage.py load_sharoff_data --dbfile russian.sqlite3
$ ./manage.py load_rnc_data --dbfile russian.sqlite3
$ ./manage.py load_icon_data --dbfile russian.sqlite3
$ sqlite3 russian.sqlite3 .dump > russian.sql
$ gzip russian.sql && mv russian.sql.gz clancy_database/data/russian.sql.gz
```

To import a SQL dump:

```
$ ./manage.py import_clancy_sqldump --sqlfile russian.sql
```

## Running unit tests

Python/Django:

```
$ ./manage.py test
```

Javascript:

```
$ open ./parser_tool/static/js/tests/SpecRunner.html
```

To update the coverage badge:

```
$ coverage run --source='.' manage.py test
$ coverage-badge -f -o coverage.svg
```

## Fetching icons from the Noun Project

You can fetch icons from the Noun Project for the "dobble" game in the following way:

### Requirements:

- Get a Noun Project API key and secret. Those can be obtained at [https://thenounproject.com/developers/](https://thenounproject.com/developers/).
- Set the key and secret in the corresponding `NOUN_PROJECT_API_KEY` and `NOUN_PROJECT_API_SECRET` environment variables
- Steven Clancy's master spreadsheet in CSV format

### Running the script

To successfully run the command, you need to pass the following arguments:

- `--input_file` (the master spreadsheet as a csv)
- `--output_file` (the name of the file that the command should write to)
- `--level` (the Clancy classification for word level)

Example:

```sh
(env)$ ./manage.py fetch_noun_icons --input_file=TheFile.csv --output_file=1E_noun_icons.csv --level=1E
```

#### Notes

- The file write has `w+` permissions, meaning it will truncate a file if it already exists. Try not to lose any important work!
- The Noun Project's free tier is 5,000 requests per month. You can run out of that quickly
