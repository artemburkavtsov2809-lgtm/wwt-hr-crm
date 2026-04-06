FROM python:3.11-slim

WORKDIR /app

# Встановлення системних залежностей
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
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

# Міграції та запуск при старті контейнера
CMD sh -c "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --timeout 60"