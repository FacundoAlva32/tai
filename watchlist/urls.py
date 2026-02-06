from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='watchlist_index'),
    path('add/', views.add_item, name='add_watch_item'),
    path('delete/<int:item_id>/', views.delete_item, name='delete_watch_item'),
    path('toggle/<int:item_id>/', views.toggle_watched, name='toggle_watched'),
    path('add_review/<int:item_id>/', views.add_review, name='add_review'),
]
