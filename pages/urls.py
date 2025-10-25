from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_page, name='index'),
    path('about/', views.about_page, name='about'),
    path('track-click/', views.track_game_click, name='track-game-click'),
    path('ads-info/', views.ads_info_page, name='ads-info'),
    path('support-us/', views.choose_option_page, name='choose-option'),
    path('payment-options/', views.payment_options_page, name='payment-options'),
    path('card-payment/', views.card_payment_page, name='card-payment'),
    path('crypto-payment/', views.crypto_payment_page, name='crypto-payment'),
    path('mobile-payment/', views.mobile_payment_page, name='mobile-payment'),
    path('watch-ads/', views.watch_ads_page, name='watch-ads'),
]
