from django.contrib.auth.models import AbstractUser

from django.db import models

class CustomUser(AbstractUser):
    balance = models.DecimalField(decimal_places=2, default=1000.0, max_digits=10)
    blinko_balance = models.DecimalField(decimal_places=2, default=1000.0, max_digits=10)
    blingo_balance = models.DecimalField(decimal_places=2, default=1000.0, max_digits=10)
    phone = models.CharField(max_length=15, blank=True)
    blinko_plays_today = models.IntegerField(default=0)
    last_blinko_play_date = models.DateField(null=True, blank=True)
    blingo_plays_today = models.IntegerField(default=0)
    last_blingo_play_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.username
