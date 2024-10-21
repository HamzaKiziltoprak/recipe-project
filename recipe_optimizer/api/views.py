from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json
from collections import deque

def build_graph(tasks):
    graph = {}
    indegree = {}
    for task in tasks:
        task_id = task['id']
        graph[task_id] = []
        indegree[task_id] = 0
    for task in tasks:
        for prereq in task['prerequisites']:
            graph[prereq].append(task['id'])
            indegree[task['id']] += 1
    return graph, indegree
 
def topological_sort(tasks):
    graph, indegree = build_graph(tasks)
    queue = deque([task['id'] for task in tasks if indegree[task['id']] == 0])
    topo_order = []
    while queue:
        current_task = queue.popleft()
        topo_order.append(current_task)
        for neighbor in graph[current_task]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    if len(topo_order) == len(tasks):
        return topo_order
    else:
        raise Exception("There is a cycle in the graph, tasks cannot be sorted.")
 
def schedule_tasks(tasks):
    sorted_tasks_ids = topological_sort(tasks)
    sorted_tasks = [next(task for task in tasks if task['id'] == task_id) for task_id in sorted_tasks_ids] 
    current_time = 0
    chef_available_time = 0
 
    for task in sorted_tasks:
        if not task["occupies_chef"] and not task["prerequisites"]:
            task["start_time"] = 0
            task["end_time"] = task["time"]
            
        elif not task["occupies_chef"]:
            prereq_end_time = max(next(t["end_time"] for t in sorted_tasks if t["id"] == prereq) for prereq in task["prerequisites"])
            
            task["start_time"] = prereq_end_time
            task["end_time"] = task["start_time"] + task["time"]
            
        else:
            prereq_end_time = max(next(t["end_time"] for t in sorted_tasks if t["id"] == prereq) for prereq in task["prerequisites"]) if task["prerequisites"] else 0
            task["start_time"] = max(current_time, chef_available_time, prereq_end_time)
            task["end_time"] = task["start_time"] + task["time"]
            chef_available_time = task["end_time"]
            current_time = task["end_time"]
    sorted_tasks.sort(key=lambda x: x["end_time"])
    return sorted_tasks

_tasks = tasks = [
    {
        "order": 0,
        "id": "mix-the-dry-ingredients",
        "content": "Mix the dry ingredients",
        "time": 2,
        "prerequisites": [],
        "occupies_chef": True,
    },
    {
        "order": 3,
        "id": "combine-the-dry-and-wet-ingredients",
        "content": "Combine the dry and wet ingredients",
        "time": 5,
        "prerequisites": ["mix-the-dry-ingredients", "mix-the-wet-ingredients"],
        "occupies_chef": True,
    },
    {
        "order": 2,
        "id": "mix-the-wet-ingredients",
        "content": "Mix the butter, sugar, egg, and vanilla in a bowl",
        "time": 3,
        "prerequisites": ["allow-ingredients-to-reach-room-temperature"],
        "occupies_chef": True,
    },
    {
        "order": 4,
        "id": "add-the-chocolate-chips",
        "content": "Add the chocolate chips",
        "time": 1,
        "prerequisites": ["combine-the-dry-and-wet-ingredients"],
        "occupies_chef": True,
    },
    {
        "order": 5,
        "id": "chill-the-dough",
        "content": "Chill the dough",
        "time": 60,
        "prerequisites": ["add-the-chocolate-chips"],
        "occupies_chef": False,
    },
    {
        "order": 1,
        "id": "allow-ingredients-to-reach-room-temperature",
        "content": "Allow the butter and egg to reach room temperature",
        "time": 10,
        "prerequisites": [],
        "occupies_chef": False,
    },
    {
        "order": 6,
        "id": "roll-the-dough-into-balls",
        "content": "Roll the dough into balls",
        "time": 10,
        "prerequisites": ["chill-the-dough"],
        "occupies_chef": True,
    },
    {
        "order": 7,
        "id": "preheat-the-oven",
        "content": "Preheat the oven",
        "time": 15,
        "prerequisites": [],
        "occupies_chef": False,
    },
    {
        "order": 8,
        "id": "bake-the-cookies",
        "content": "Bake the cookies",
        "time": 15,
        "prerequisites": ["roll-the-dough-into-balls", "preheat-the-oven"],
        "occupies_chef": False,
    }
]

# temporary for postman tests
# @csrf_exempt
def process_tasks(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            tasks = data.get("tasks", [])

            if not tasks: 
                tasks = _tasks
            current_time = 0

            tasks = schedule_tasks(tasks)
            tasks.sort(key=lambda x: x["end_time"])
            for i in range(len(tasks)):
                tasks[i]["order"] = i

            return JsonResponse(tasks, safe=False, json_dumps_params={'indent': 4})

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    # retur GET request to page 
    return render(request, 'api/index.html')