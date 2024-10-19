from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt  # temporary for postman tests
def process_tasks(request):
    if request.method == "POST":
        try:
            
            data = json.loads(request.body)
            tasks = data.get("tasks", [])

            if not tasks:
                tasks = [
                            {
                                "order": 0,
                                "id": "mix-the-dry-ingredients",
                                "content": "Mix the dry ingredients",
                                "time": 2,
                                "prerequisites": [],
                                "occupies_chef": True
                            },
                            {
                                "order": 1,
                                "id": "allow-ingredients-to-reach-room-temperature",
                                "content": "Allow the butter and egg to reach room temperature",
                                "time": 10,
                                "prerequisites": [],
                                "occupies_chef": False
                            },
                            {
                                "order": 2,
                                "id": "mix-the-wet-ingredients",
                                "content": "Mix the butter, sugar, egg, and vanilla in a bowl",
                                "time": 3,
                                "prerequisites": ["allow-ingredients-to-reach-room-temperature"],
                                "occupies_chef": True
                            },
                            {
                                "order": 3,
                                "id": "combine-the-dry-and-wet-ingredients",
                                "content": "Combine the dry and wet ingredients",
                                "time": 5,
                                "prerequisites": ["mix-the-dry-ingredients", "mix-the-wet-ingredients"],
                                "occupies_chef": True
                            },
                            {
                                "order": 4,
                                "id": "add-the-chocolate-chips",
                                "content": "Add the chocolate chips",
                                "time": 1,
                                "prerequisites": ["combine-the-dry-and-wet-ingredients"],
                                "occupies_chef": True
                            },
                            {
                                "order": 5,
                                "id": "chill-the-dough",
                                "content": "Chill the dough",
                                "time": 60,
                                "prerequisites": ["add-the-chocolate-chips"],
                                "occupies_chef": False
                            },
                            {
                                "order": 6,
                                "id": "roll-the-dough-into-balls",
                                "content": "Roll the dough into balls",
                                "time": 10,
                                "prerequisites": ["chill-the-dough"],
                                "occupies_chef": True
                            },
                            {
                                "order": 7,
                                "id": "preheat-the-oven",
                                "content": "Preheat the oven to 350 degrees",
                                "time": 10,
                                "prerequisites": [],
                                "occupies_chef": False
                            },
                            {
                                "order": 8,
                                "id": "form-the-cookies",
                                "content": "Form the cookies",
                                "time": 15,
                                "prerequisites": ["chill-the-dough", "preheat-the-oven"],
                                "occupies_chef": False
                            }
                        ]
            current_time = 0
            
            def prerequisites_completed(task, tasks):
                return all(next((x for x in tasks if x["id"] == prereq and x["completed"]), False) for prereq in task["prerequisites"])
            
            for task in tasks:
                task["completed"] = False
                task["start_time"] = None
                task["end_time"] = None

            while any(not task["completed"] for task in tasks):
                for task in tasks:
                    if task["completed"]:
                        continue 
                    if prerequisites_completed(task, tasks):
                        if len(task["prerequisites"]) == 0:
                            task["start_time"] = 0
                            task["end_time"] = task["time"]
                            task["completed"] = True
                            if task["time"] > current_time:
                                current_time = task["time"]
                        elif not task["occupies_chef"]:  # Non-occupying task
                            task["start_time"] = current_time
                            task["end_time"] = current_time + task["time"]
                            task["completed"] = True
                            if task["prerequisites"]:
                                current_time += task["time"]
                            if task["time"] > current_time:
                                current_time += task["time"]
                        else:  # Occupying task
                            task["start_time"] = current_time
                            task["end_time"] = current_time + task["time"]
                            task["completed"] = True
                            current_time += task["time"]

            unoc_unpre = [task for task in tasks if not task["occupies_chef"] and not task["prerequisites"]]
            for task in unoc_unpre:
                for t in tasks:
                    if task["id"] in t["prerequisites"]:
                                    task["start_time"] = t["start_time"] - task["time"] - 5 if t["start_time"] - task["time"] - 5 > 0 else t["start_time"] - task["time"]
                                    task["end_time"] = t["start_time"]
                                    break
            for task in unoc_unpre:
                for t in tasks:
                    if t["id"] == task["id"]:
                        t.update(task)
                        break
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