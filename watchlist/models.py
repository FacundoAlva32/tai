from django.db import models
from django.contrib.auth.models import User

class WatchItem(models.Model):
    TYPES = (
        ('MOVIE', 'Movie'),
        ('SERIES', 'Series'),
        ('VIDEO', 'Video'),
    )
    title = models.CharField(max_length=200)
    item_type = models.CharField(max_length=10, choices=TYPES, default='MOVIE')
    rating = models.IntegerField(default=0, choices=[(i, str(i)) for i in range(6)])
    comment = models.TextField(blank=True)
    is_watched = models.BooleanField(default=False)
    added_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class Review(models.Model):
    watch_item = models.ForeignKey(WatchItem, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(default=0, choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('watch_item', 'user')

    def __str__(self):
        return f"{self.user.username} on {self.watch_item.title}"
