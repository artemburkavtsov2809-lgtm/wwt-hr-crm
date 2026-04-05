FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements.txt

RUN python manage.py migrate --noinput
RUN python manage.py collectstatic --noinput

EXPOSE 8080

# Спрощена команда запуску
CMD gunicorn config.wsgi:application --bind 0.0.0.0:8080 --workers 2 --log-level debug