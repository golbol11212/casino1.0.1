from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_page, name='index'),
    path('about/', views.about_page, name='about'),
    path('track-click/', views.track_game_click, name='track-game-click'),
]
