from django.db import models
from django.conf import settings
from decimal import Decimal  # Добавляем импорт

class GameClick(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    game_name = models.CharField(max_length=100)
    target_url = models.URLField()
    timestamp = models.DateTimeField(auto_now_add=True)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    new_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.game_name} clicked by {self.user}"

    def save(self, *args, **kwargs):
        # Преобразуем значения к Decimal перед вычислением
        self.total = Decimal(str(self.new_balance)) - Decimal(str(self.current_balance))
        super().save(*args, **kwargs)