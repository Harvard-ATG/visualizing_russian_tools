FROM python:3
ENV PYTHONUNBUFFERED 1

COPY . /app
WORKDIR /app

RUN pip install pipenv
RUN pipenv install --system --deploy

EXPOSE 8000
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
