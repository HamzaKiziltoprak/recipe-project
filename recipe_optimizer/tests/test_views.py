import django
from django.conf import settings
if not settings.configured:
    django.setup()
    
import pytest
from django.urls import reverse
from django.test import Client
import json

client = Client()

@pytest.mark.django_db
def test_process_tasks_get_request():
    response = client.get(reverse('process_tasks'))
    assert response.status_code == 200
    assert 'text/html' in response['Content-Type']

@pytest.mark.django_db
def test_process_tasks_post_request_with_data():
    payload = {
        "tasks": [
            {
                "order": 0,
                "id": "mix-the-dry-ingredients",
                "content": "Mix the dry ingredients",
                "time": 2,
                "prerequisites": [],
                "occupies_chef": True
            }
        ]
    }
    response = client.post(
        reverse('process_tasks'),
        data=json.dumps(payload),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['id'] == "mix-the-dry-ingredients"
    assert data[0]['completed'] is True

@pytest.mark.django_db
def test_process_tasks_post_request_without_data():
    response = client.post(
        reverse('process_tasks'),
        data=json.dumps({}),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 1  
    
@pytest.mark.django_db
def test_process_tasks_post_request_invalid_json():
    response = client.post(
        reverse('process_tasks'),
        data="invalid-json",
        content_type='application/json'
    )
    assert response.status_code == 400
    assert response.json() == {"error": "Invalid JSON."}