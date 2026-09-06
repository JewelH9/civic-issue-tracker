#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Temporary: create a superuser on first deploy if one doesn't already exist.
# Safe to run on every deploy — get_or_create-style check prevents duplicates/errors.
python manage.py shell -c "
from django.contrib.auth.models import User
from issues.models import Profile
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    user = User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD')
    Profile.objects.create(user=user, role='admin')
    print('Superuser created.')
else:
    print('Superuser already exists, skipping.')
"