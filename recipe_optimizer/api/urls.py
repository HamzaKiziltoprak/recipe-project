from django.urls import path,include
from . import views
urlpatterns = [
    #path('',views.index,name='index'),
        path('tasks/', views.process_tasks, name='process_tasks'),

]

