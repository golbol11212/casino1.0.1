from django.shortcuts import render, redirect
from django.urls import path
from django.contrib.auth.decorators import login_required
from . import views
from pages.models import GameClick
from django.db.models import Count, Max




@login_required
def prof(request):
    # Получаем историю игр пользователя
    game_history = GameClick.objects.filter(user=request.user).order_by('-timestamp')[:20]
    
    # Рассчитываем статистику
    total_games = GameClick.objects.filter(user=request.user).count()
    
    # Находим любимую игру (игру с наибольшим количеством записей)
    favorite_game_query = GameClick.objects.filter(user=request.user) \
        .values('game_name') \
        .annotate(count=Count('game_name')) \
        .order_by('-count') \
        .first()
    
    favorite_game = favorite_game_query['game_name'] if favorite_game_query else "Нет данных"
    
    # Последняя активность
    last_activity = GameClick.objects.filter(user=request.user) \
        .aggregate(last=Max('timestamp'))['last']
    
    context = {
        'user': request.user,
        'game_history': game_history,
        'total_games': total_games,
        'favorite_game': favorite_game,
        'last_activity': last_activity,
    }
    
    return render(request, 'profil/prof.html', context)