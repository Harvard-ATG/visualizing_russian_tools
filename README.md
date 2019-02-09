# Visualizing Russian Tools

Visualizing Russian is a suite of web-based tools for language learners, researchers, and teachers. 

## Getting Started

```
pipenv run pip install pip==18.0
pipenv install
pipenv shell
./manage.py migrate
./manage.py setup_clancy_database
./manage.py runserver
```

Using docker:

```
docker build . -t visualizing_russian_tools
docker run -p 8000:8000 visualizing_russian_tools
```

Or with docker-compose:

```
docker-compose up
```