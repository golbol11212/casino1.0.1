# game/urls.py
from django.urls import path
from django.contrib.auth.views import LoginView 
from . import views
from .views import save_game_attempt, update_redirect, save_blinko_score


urlpatterns = [
    path('case/silver/', views.case_silver, name='case_silver'),
    path('case/bronze/', views.case_bronze, name='case_bronze'),
    path('case/gold/', views.case_gold, name='case_gold'),
    path('open-case/', views.open_case, name='open_case'),
    path('craps/', views.craps, name='craps'),
    path('fortune/', views.fortune, name='fortune'),
    path('punto-banco/', views.punto_banco, name='punto_banco'),
    path('blackjack/', views.Blackjack, name='Blackjack'),
    path('roulette/', views.roulette, name='roulette'),
    path('blingo/', views.blingo, name='blingo'), # Blingo (поиск чисел)
    path('blinko/', views.blinko, name='blinko'), # Plinko
    path('update_redirect/', views.update_redirect, name='update_redirect'), # update_redirect для Blingo (поиск чисел) и других игр
    path('craps/place_bet/', views.place_craps_bet, name='place_craps_bet'),
    path('craps/roll_dice/', views.roll_craps_dice, name='roll_craps_dice'),
    path('fortune/spin/', views.spin_fortune, name='spin_fortune'),
    path('punto_banco/place_bet/', views.place_punto_banco_bet, name='place_punto_banco_bet'),
    path('punto_banco/deal/', views.deal_punto_banco, name='deal_punto_banco'),
    
    # URL-ы для Blingo (поиск чисел)
    path('check_blingo_attempts/', views.check_blingo_attempts, name='check_blingo_attempts'),
    path('blingo/save-attempt/', views.save_game_attempt, name='save_attempt'),
    path('start-blingo-play/', views.start_blingo_play, name='start_blingo_play'),

    # URL-ы для Blinko (Plinko)
    path('save-blinko-score/', views.save_blinko_score, name='save_blinko_score'),
    path('reset-blinko/', views.reset_blinko_attempts, name='reset_blinko_attempts'), # URL для сброса попыток
    path('update_roulette_balance/', views.update_roulette_balance, name='update_roulette_balance'),
    path('update_blackjack_balance/', views.update_blackjack_balance, name='update_blackjack_balance'),
]
