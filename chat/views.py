from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import Message
import json

@login_required
def get_messages(request):
    messages = Message.objects.select_related('user').order_by('-timestamp')[:50]
    data = [
        {
            'id': msg.id,
            'user': msg.user.username,
            'is_user': msg.user == request.user,
            'content': msg.content,
            'image_url': msg.image.url if msg.image else None,
            'timestamp': msg.timestamp.isoformat()
        } for msg in reversed(messages)
    ]
    return JsonResponse({'messages': data})

@login_required
@csrf_exempt
def send_message(request):
    if request.method == 'POST':
        content = request.POST.get('content', '')
        image = request.FILES.get('image')

        if content or image:
            Message.objects.create(user=request.user, content=content, image=image)
            return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'}, status=400)
