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
        ('tranqui', 'Tranqui'),
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

    created_at = models.DateTimeField(auto_now_add=True)

    def get_emoji(self):
        from django.utils.safestring import mark_safe
        
        # Consistent SVGs with main.js
        svgs = {
            'angry': """<svg viewBox="0 0 36 36" fill="url(#grad_angry)"><defs><linearGradient id="grad_angry" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FF5E62;stop-opacity:1" /><stop offset="100%" style="stop-color:#FF9966;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><path fill="#FFF" d="M11 23c0-2.5 7-2.5 14 0M10 14l5 2M26 14l-5 2" stroke="#FFF" stroke-width="2" stroke-linecap="round"/></svg>""",
            
            'sad': """<svg viewBox="0 0 36 36" fill="url(#grad_sad)"><defs><linearGradient id="grad_sad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#5B86E5;stop-opacity:1" /><stop offset="100%" style="stop-color:#36D1DC;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><circle fill="#FFF" cx="12" cy="14" r="2"/><circle fill="#FFF" cx="24" cy="14" r="2"/><path fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" d="M12 25s3-2 6-2 6 2 6 2"/><path fill="#FFF" d="M25 15c.5 2 1 4 0 5" opacity="0.5"/></svg>""",
            
            'tired': """<svg viewBox="0 0 36 36" fill="url(#grad_tired)"><defs><linearGradient id="grad_tired" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#bdc3c7;stop-opacity:1" /><stop offset="100%" style="stop-color:#2c3e50;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><path fill="none" stroke="#FFF" stroke-width="2" d="M10 16h6M20 16h6"/><circle fill="#FFF" cx="28" cy="12" r="3" opacity="0.5"/><circle fill="#FFF" cx="32" cy="8" r="1.5" opacity="0.5"/><path fill="none" stroke="#FFF" stroke-width="2" d="M14 24s2 2 4 2 4-2 4-2"/></svg>""",
            
            'calm': """<svg viewBox="0 0 36 36" fill="url(#grad_calm)"><defs><linearGradient id="grad_calm" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#89f7fe;stop-opacity:1" /><stop offset="100%" style="stop-color:#66a6ff;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><circle fill="#FFF" cx="12" cy="15" r="2"/><circle fill="#FFF" cx="24" cy="15" r="2"/><path fill="none" stroke="#FFF" stroke-width="2" d="M13 22s2.5 2 5 2 5-2 5-2"/></svg>""",
            
            'happy': """<svg viewBox="0 0 36 36" fill="url(#grad_happy)"><defs><linearGradient id="grad_happy" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#F2994A;stop-opacity:1" /><stop offset="100%" style="stop-color:#F2C94C;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><path fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" d="M12 22s2.5 3 6 3 6-3 6-3"/><circle fill="#FFF" cx="12" cy="14" r="2"/><circle fill="#FFF" cx="24" cy="14" r="2"/></svg>""",
            
            'love': """<svg viewBox="0 0 36 36" fill="url(#grad_love)"><defs><linearGradient id="grad_love" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff9a9e;stop-opacity:1" /><stop offset="100%" style="stop-color:#fecfef;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><path fill="#FFF" d="M18 25s-7-4-9-9c-2-5 3-8 6-5 1 1 3 4 3 4s2-3 3-4c3-3 8 0 6 5-2 5-9 9-9 9z"/></svg>"""
        }
        
        # Map Spanish/Alt keys to the canonical English keys
        key_map = {
            'enojado': 'angry', 'angry': 'angry',
            'triste': 'sad', 'sad': 'sad',
            'cansado': 'tired', 'tired': 'tired',
            'calmado': 'calm', 'tranqui': 'calm', 'calm': 'calm',
            'feliz': 'happy', 'happy': 'happy',
            'amoroso': 'love', 'love': 'love'
        }
        
        canonical = key_map.get(self.mood, 'calm')
        return mark_safe(svgs.get(canonical, svgs['calm']))

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.mood} at {self.created_at}"
