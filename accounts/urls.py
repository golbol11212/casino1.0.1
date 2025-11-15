from django.urls import path
from django.contrib.auth.views import LoginView
from . import views
from accounts.views import CustomLoginView

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('get_balance/', views.get_user_balance, name='get_user_balance'),
    path('get_balances/', views.get_balances, name='get_balances'),
]
