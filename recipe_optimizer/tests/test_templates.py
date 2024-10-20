import django
from django.conf import settings
if not settings.configured:
    django.setup()
    
import pytest
from django.urls import reverse
from django.test import Client

@pytest.fixture
def client():
    """Fixture to create a test client."""
    return Client()

@pytest.mark.django_db
def test_template_rendering(client):
    """Test if the template renders correctly."""
    url = reverse('process_tasks') 
    response = client.get(url)

    assert response.status_code == 200  
    assert b"Add/Edit Step" in response.content  
    assert b"Step Name" in response.content  
    assert b"Requires Chef" in response.content 
    assert b"Steps from API (Sorted)" in response.content  
    
@pytest.mark.django_db
def test_template_has_expected_form_fields(client):
    """Test if the template contains the required form fields."""
    response = client.get(reverse('process_tasks'))

    assert b'id="stepName"' in response.content  
    assert b'id="stepDuration"' in response.content 
    assert b'id="dependency"' in response.content 

@pytest.mark.django_db
def test_template_contains_dynamic_content_section(client):
    """Test if dynamic content placeholders exist in the template."""
    response = client.get(reverse('process_tasks'))

    assert b'id="stepsBody"' in response.content  
    assert b'id="apiStepsBody"' in response.content 

@pytest.mark.django_db
def test_template_has_correct_buttons(client):
    """Test if the template contains the expected buttons."""
    response = client.get(reverse('process_tasks'))

    assert b'id="submitButton"' in response.content  
    assert b"View Result" in response.content  