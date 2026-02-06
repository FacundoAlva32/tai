from django.urls import path
from . import views

urlpatterns = [
    path('get/', views.get_messages, name='get_messages'),
    path('send/', views.send_message, name='send_message'),
]
