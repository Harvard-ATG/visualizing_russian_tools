FROM python:3.8-slim
ENV PYTHONUNBUFFERED 1

COPY . /app
WORKDIR /app

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y install gzip sqlite3 libsqlite3-dev
RUN pip install -r requirements.txt

EXPOSE 8000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
