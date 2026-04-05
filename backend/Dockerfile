FROM python:3.11-slim

WORKDIR /app

# Копіюємо все з поточної папки
COPY . /app

# Встановлюємо залежності
RUN pip install --no-cache-dir -r requirements.txt

# Міграції
RUN python manage.py migrate --noinput || true
RUN python manage.py collectstatic --noinput || true

EXPOSE 8080

CMD python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2