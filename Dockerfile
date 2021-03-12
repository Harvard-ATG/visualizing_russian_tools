FROM python:3.8-slim
ENV PYTHONUNBUFFERED 1
ENV PYTHONFAULTHANDLER=1

COPY . /app
WORKDIR /app

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y install build-essential python3-dev curl gzip sqlite3 libsqlite3-dev && apt-get clean
RUN pip install -r requirements.txt
RUN ./manage.py migrate \
    && ./manage.py import_clancy_sqldump 
RUN ./manage.py build_annoy_forest

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 CMD [ "curl -f http://127.0.0.1:8000/healthcheck" ]
ENTRYPOINT ["/app/docker-entrypoint.sh"]
