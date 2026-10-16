import os
import sys
from pathlib import Path
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

# Fast password hasher for test suite execution speed
if 'test' in sys.argv:
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.MD5PasswordHasher',
    ]

DJANGO_ENV = os.environ.get('DJANGO_ENV', 'development')
DEBUG = os.environ.get('DJANGO_DEBUG', 'True' if DJANGO_ENV == 'development' else 'False').lower() in ('true', '1', 'yes')

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    if DEBUG or DJANGO_ENV == 'development':
        SECRET_KEY = 'dev-secret-key-only-for-local-development-financial-v5-random-seed-phrase-not-for-prod'
    else:
        raise ImproperlyConfigured("In production, DJANGO_SECRET_KEY must be set to a secure, unique key with at least 50 characters.")
elif len(SECRET_KEY) < 50 or SECRET_KEY.startswith('django-insecure-'):
    if not DEBUG:
        raise ImproperlyConfigured("Production DJANGO_SECRET_KEY must have at least 50 characters and not use insecure prefix.")

raw_hosts = os.environ.get('DJANGO_ALLOWED_HOSTS')
if raw_hosts:
    ALLOWED_HOSTS = [h.strip() for h in raw_hosts.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['*'] if DEBUG else ['localhost', '127.0.0.1', '[::1]']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'corsheaders',
    'ninja_jwt',
    
    # Internal apps
    'apps.users',
    'apps.inventory',
    'apps.cutting',
    'apps.sewing',
    'apps.financial',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

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

WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'fa-ir'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = DEBUG and os.environ.get('DJANGO_CORS_ALLOW_ALL', 'True').lower() in ('true', '1')
cors_origins_env = os.environ.get('DJANGO_CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')
CORS_ALLOWED_ORIGINS = [o.strip() for o in cors_origins_env.split(',') if o.strip()]
CORS_ALLOW_CREDENTIALS = True

# Production Security Configuration & SSL / Cookie Hardening
if not DEBUG:
    SECURE_SSL_REDIRECT = os.environ.get('DJANGO_SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1')
    SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.environ.get('DJANGO_SECURE_HSTS_SUBDOMAINS', 'True').lower() in ('true', '1')
    SECURE_HSTS_PRELOAD = os.environ.get('DJANGO_SECURE_HSTS_PRELOAD', 'True').lower() in ('true', '1')
    SESSION_COOKIE_SECURE = os.environ.get('DJANGO_SESSION_COOKIE_SECURE', 'True').lower() in ('true', '1')
    CSRF_COOKIE_SECURE = os.environ.get('DJANGO_CSRF_COOKIE_SECURE', 'True').lower() in ('true', '1')
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

NINJA_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}
