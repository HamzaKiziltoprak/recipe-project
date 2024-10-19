from django.test import TestCase,Client
from django.urls import reverse
import json

class ProcessTasksViewTest(TestCase):
    
    def test_process_tasks_post_with_empty_tasks(self):
        """Test POST request with empty tasks, should return default tasks."""
        response = self.client.post(reverse('process_tasks'), json.dumps({}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        response_data = response.json()
        self.assertGreater(len(response_data), 0)
        self.assertIn('mix-the-dry-ingredients', [task['id'] for task in response_data])

    def test_process_tasks_post_with_custom_tasks(self):
        """Test POST request with custom tasks."""
        custom_tasks = {
            "tasks": [
                {"order": 0, "id": "custom-task-1", "content": "Custom Task 1", "time": 5, "prerequisites": [], "occupies_chef": True},
                {"order": 1, "id": "custom-task-2", "content": "Custom Task 2", "time": 3, "prerequisites": ["custom-task-1"], "occupies_chef": True},
            ]
        }
        response = self.client.post(reverse('process_tasks'), json.dumps(custom_tasks), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        self.assertEqual(len(response_data), 2)
        self.assertTrue(all(task["completed"] for task in response_data))

    def test_process_tasks_get(self):
        """Test GET request, should render the index.html."""
        response = self.client.get(reverse('process_tasks'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'api/index.html')

    def test_process_tasks_post_invalid_json(self):
        """Test POST request with invalid JSON."""
        response = self.client.post(reverse('process_tasks'), '{"tasks":', content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid JSON.", response.json().get("error"))


class TemplateViewTest(TestCase):

    def test_index_template(self):
        """Test index.html template is rendered correctly."""
        response = self.client.get(reverse('process_tasks'))  
        self.assertEqual(response.status_code, 200)  
        self.assertTemplateUsed(response, 'api/index.html') 

        self.assertContains(response, "Add Recipe Steps")
        self.assertContains(response, "Added Steps") 
        self.assertContains(response, "Steps from API (Sorted)")  

    def test_step_addition(self):
        """Test that the step addition works correctly."""
        pass

class URLTests(TestCase):

    def test_process_tasks_url(self):
        """Test the process_tasks URL."""
        response = self.client.get(reverse('process_tasks'))  
        self.assertEqual(response.status_code, 200)  
        self.assertTemplateUsed(response, 'api/index.html') 

    def test_process_tasks_url_not_found(self):
        """Test URL that does not exist."""
        response = self.client.get('/non-existent-url/')
        self.assertEqual(response.status_code, 404)