from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='notes_index'),
    path('manage/', views.manage_note, name='create_note'),
    path('manage/<int:note_id>/', views.manage_note, name='manage_note'),
]
