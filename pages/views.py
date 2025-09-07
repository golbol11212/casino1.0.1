# pages/views.py

from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_protect
from .models import GameClick
from decimal import Decimal # Добавим Decimal для current_balance


def home_page(request):
    return render(request, 'pages/index.html')

def about_page(request):
    return render(request, 'pages/about.html')

@csrf_protect # Используем декоратор для POST запросов
def track_game_click(request):
    if request.method == 'POST':
        game_name = request.POST.get('game_name')
        target_url = request.POST.get('target_url')

        # Берем текущий баланс из сессии, если он есть, иначе 0
        # Важно: баланс в сессии должен быть Decimal, если хотите точное сравнение,
        # иначе преобразуйте к Decimal при создании GameClick.
        current_balance = request.session.get('balance', Decimal('0.00')) # Приводим к Decimal

        game_click = GameClick.objects.create(
            user=request.user if request.user.is_authenticated else None,
            game_name=game_name,
            target_url=target_url,
            current_balance=Decimal(str(current_balance)), # Убедимся, что это Decimal
            new_balance=Decimal('0.00'),                    # пока 0, обновится позже
            total=Decimal('0.00')                           # пересчитается в save()
        )
        request.session['last_game_click_id'] = game_click.id
        request.session.modified = True # Обязательно, чтобы сохранить изменения в сессии

        return redirect(target_url)
    return redirect('home')