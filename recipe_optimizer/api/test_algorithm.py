import pytest
from django.urls import reverse
from django.test import Client
from api.views import schedule_tasks, topological_sort
import json

def test_schedule_tasks():
    tasks = [
        {"id": "task1", "time": 5, "prerequisites": [], "occupies_chef": True},
        {"id": "task2", "time": 3, "prerequisites": ["task1"], "occupies_chef": True}
    ]
    result = schedule_tasks(tasks)
    assert result[0]["id"] == "task1"
    assert result[1]["id"] == "task2"

def test_topological_sort_with_cycle():
    tasks_with_cycle = [
        {"id": "task1", "prerequisites": ["task2"]},
        {"id": "task2", "prerequisites": ["task1"]}
    ]
    with pytest.raises(Exception):
        topological_sort(tasks_with_cycle)