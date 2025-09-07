from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from .forms import RegisterForm
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy


def register(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # Автоматический вход после регистрации
            return redirect('index')  # Редирект на главную
    else:
        form = RegisterForm()
    return render(request, 'accounts/register.html', {'form': form})

class CustomLoginView(LoginView):
    template_name = 'accounts/login.html'
    
    def form_valid(self, form):
        # Вызываем родительский метод для стандартной аутентификации
        response = super().form_valid(form)
        
        # Сохраняем username в сессии
        self.request.session['username'] = form.get_user().username
        
        # Можно сохранить и другие данные пользователя
        self.request.session['user_id'] = form.get_user().id

        self.request.session['balance'] = float(form.get_user().balance)
        
        return response

from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

def logout_view(request):
    logout(request)
    return redirect('index')

@login_required
def get_user_balance(request):
    if request.user.is_authenticated:
        return JsonResponse({'balance': float(request.user.balance)})
    return JsonResponse({'balance': 0.0}) # Возвращаем 0, если пользователь не аутентифицирован
