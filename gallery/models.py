from django.db import models
from django.contrib.auth.models import User

class Photo(models.Model):
    image = models.ImageField(upload_to='gallery/')
    description = models.CharField(max_length=500, blank=True)
    uploader = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def delete(self, *args, **kwargs):
        self.image.delete()
        super().delete(*args, **kwargs)
