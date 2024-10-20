import django
from django.conf import settings
if not settings.configured:
    django.setup()
    
import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_admin_url(client):
    response = client.get('/admin/')
    assert response.status_code == 200

@pytest.mark.django_db
def test_api_index_url(client):
    response = client.get('/')
    assert response.status_code == 200

@pytest.mark.django_db
def test_included_urls(client):
    response = client.get(reverse('process_tasks'))
    assert response.status_code == 200