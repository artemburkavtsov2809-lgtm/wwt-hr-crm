FROM python:3.11-slim

# Встановлення робочої директорії
WORKDIR /app

# Копіювання requirements.txt та встановлення залежностей
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіювання всього проекту
COPY backend/ .

# Виконання міграцій та збір статики
RUN python manage.py migrate --noinput || true
RUN python manage.py collectstatic --noinput || true

# Відкриття порту
EXPOSE 8080

# Запуск Gunicorn
CMD python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2