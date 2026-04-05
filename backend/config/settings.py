import os
from pathlib import Path
from decouple import config as env
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# ===================== SECURITY =====================
SECRET_KEY = env('SECRET_KEY', default='django-insecure-f3*22^^k$r!yy*mx(vhga(_kx6ai5pje0_z%9c(h1%ti(diqa2')
DEBUG = env('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = env('ALLOWED_HOSTS', default='localhost,127.0.0.1,*').split(',')

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

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

# ===================== DATABASE =====================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

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
    default='http://localhost:5173,http://127.0.0.1:5173'
).split(',')

CORS_ALLOW_CREDENTIALS = True

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