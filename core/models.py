from django.db import models
from django.contrib.auth.models import User

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

class Mood(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mood')
    text = models.CharField(max_length=120)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}: {self.text}"

class MoodEntry(models.Model):
    MOOD_CHOICES = [
        ('enojado', 'Enojado'),
        ('triste', 'Triste'),
        ('cansado', 'Cansado'),
        ('calmado', 'Calmado'),
        ('feliz', 'Feliz'),
        ('amoroso', 'Amoroso'),
        # Keep English for backward compatibility if needed, or primarily switch to Spanish
        ('angry', 'Angry'),
        ('sad', 'Sad'),
        ('tired', 'Tired'),
        ('calm', 'Calm'),
        ('happy', 'Happy'),
        ('love', 'Love'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mood_entries')
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_emoji(self):
        emojis = {
            'happy': '😄', 'feliz': '😄',
            'calm': '😊', 'calmado': '😊',
            'tired': '😴', 'cansado': '😴',
            'sad': '😢', 'triste': '😢',
            'angry': '😡', 'enojado': '😡',
            'love': '❤️', 'amoroso': '❤️',
        }
        return emojis.get(self.mood, '😐')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.mood} at {self.created_at}"
