from django.db import models

class DailyPhrase(models.Model):
    text = models.CharField(max_length=255)
    author = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text

class Announcement(models.Model):
    TIME_CHOICES = [
        ('MORNING', 'Mañana (5:00 - 12:00)'),
        ('AFTERNOON', 'Tarde (12:00 - 20:00)'),
        ('EVENING', 'Noche (20:00 - 5:00)'),
        ('ALL', 'Todo el día'),
    ]
    title = models.CharField(max_length=200)
    content = models.TextField()
    time_of_day = models.CharField(max_length=10, choices=TIME_CHOICES, default='ALL')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
