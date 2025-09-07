from django.db import models
from django.utils import timezone
from django.conf import settings
from decimal import Decimal

class GameAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    game_name = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    attempts_count = models.IntegerField(default=0)
    game_score = models.IntegerField(default=0)
    result = models.CharField(max_length=20)  # win/lose
    
    class Meta:
        verbose_name = 'Игровая попытка'
        verbose_name_plural = 'Игровые попытки'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.game_name} - {self.result} - {self.user}"