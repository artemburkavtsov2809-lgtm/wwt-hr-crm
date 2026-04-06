FROM python:3.11-slim

WORKDIR /app

# Встановлення системних залежностей для psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копіювання requirements спочатку (для кешування)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіювання всього коду
COPY . .

# Збір статичних файлів
RUN python manage.py collectstatic --noinput

# Порт (Railway перезапише через $PORT)
EXPOSE 8080

# Міграції та запуск при старті контейнера з створенням суперкористувача
CMD sh -c "\
    echo 'Waiting for database...' && \
    sleep 3 && \
    python manage.py migrate --noinput && \
    python manage.py shell -c \"\
from django.contrib.auth import get_user_model; \
User = get_user_model(); \
User.objects.filter(username='admin').exists() or \
User.objects.create_superuser('admin', 'admin@wwt.com', 'WwtAdmin2026!'); \
print('Superuser check: OK') \
    \" && \
    gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --timeout 60 \
"