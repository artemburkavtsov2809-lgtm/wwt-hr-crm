import os
from pathlib import Path
from decouple import config as env
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# ===================== SECURITY =====================
SECRET_KEY = env('SECRET_KEY', default='django-insecure-f3*22^^k$r!yy*mx(vhga(_kx6ai5pje0_z%9c(h1%ti(diqa2')
DEBUG = env('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = env('ALLOWED_HOSTS', default='localhost,127.0.0.1,.railway.app,*').split(',')

# ===================== APPLICATIONS =====================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # third party
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    # local
    'employees',
    'hr_needs',
    'performance',
    'documents',
]

# ===================== MIDDLEWARE =====================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ===================== TEMPLATES =====================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

# ===================== DATABASE =====================
# Для Railway - використовуємо тимчасову директорію /tmp
# Дані будуть втрачатися при кожному перезапуску, але це дозволяє працювати з SQLite
if os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('RAILWAY_SERVICE_NAME'):
    # Railway: використовуємо /tmp для бази даних
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': '/tmp/db.sqlite3',
        }
    }
else:
    # Локальна розробка
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Якщо є змінна DATABASE_URL (PostgreSQL), використовуємо її в пріоритеті
DATABASE_URL = env('DATABASE_URL', default=None)
if DATABASE_URL:
    DATABASES['default'] = dj_database_url.parse(DATABASE_URL)

# ===================== STATIC FILES =====================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Автоматичне створення директорії staticfiles
STATIC_ROOT.mkdir(exist_ok=True)

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ===================== MEDIA =====================
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Автоматичне створення директорії media
MEDIA_ROOT.mkdir(exist_ok=True)

# ===================== INTERNATIONALIZATION =====================
LANGUAGE_CODE = 'uk'
TIME_ZONE = 'Europe/Kyiv'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===================== CORS =====================
CORS_ALLOWED_ORIGINS = env(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173,https://wwt-hr-crm-production.up.railway.app'
).split(',')

CORS_ALLOW_CREDENTIALS = True

# ===================== CSRF =====================
CSRF_TRUSTED_ORIGINS = [
    'https://wwt-hr-crm-production.up.railway.app',
    'https://*.railway.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# Для HTTPS на Railway
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

# ===================== REST FRAMEWORK =====================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ===================== AUTO MIGRATIONS FOR RAILWAY =====================
# Цей код автоматично виконує міграції при запуску на Railway
if os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('RAILWAY_SERVICE_NAME'):
    import sys
    import logging

    # Налаштування логування
    logging.basicConfig(level=logging.INFO, stream=sys.stderr)
    logger = logging.getLogger(__name__)

    try:
        from django.core.management import call_command
        from django.db import connections

        logger.info("=" * 50)
        logger.info("🚀 Railway deployment detected. Running migrations...")
        logger.info("=" * 50)

        # Виконуємо міграції
        call_command('migrate', '--noinput', verbosity=1)

        logger.info("✅ Migrations completed successfully!")

        # Перевіряємо чи є суперкористувач
        from django.contrib.auth import get_user_model

        User = get_user_model()
        if not User.objects.filter(is_superuser=True).exists():
            logger.warning("⚠️ No superuser found. Create one via: railway run python manage.py createsuperuser")

    except Exception as e:
        logger.error(f"❌ Error running migrations: {e}")
        import traceback

        traceback.print_exc()