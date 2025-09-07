from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser

class RegisterForm(UserCreationForm):
    email = forms.EmailField(label="Email")
    phone = forms.CharField(max_length=15, label="Phone")

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'phone']
        labels = {
            'username': 'Username',
        }
