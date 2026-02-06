from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required, user_passes_test
from .models import DailyPhrase, Announcement
import random
from django.utils import timezone

def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')
    
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('home')
    else:
        form = AuthenticationForm()
    
    return render(request, 'login.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required(login_url='login')
def home(request):
    # Get random active phrase
    phrases = DailyPhrase.objects.filter(is_active=True)
    hero_phrase = random.choice(phrases) if phrases else None
    
    # Get active announcement based on time of day
    now = timezone.now()
    hour = now.hour
    
    current_period = 'ALL'
    if 5 <= hour < 12:
        current_period = 'MORNING'
    elif 12 <= hour < 20:
        current_period = 'AFTERNOON'
    else:
        current_period = 'EVENING'
    
    # extensive filtering: either ALL or current period
    announcements = Announcement.objects.filter(
        is_active=True,
        time_of_day__in=['ALL', current_period]
    )
    
    announcement = random.choice(announcements) if announcements else None
    
    context = {
        'hero_phrase': hero_phrase,
        'announcement': announcement,
    }
    return render(request, 'dashboard.html', context)

@user_passes_test(lambda u: u.is_staff)
def manage_announcements(request):
    announcements = Announcement.objects.all().order_by('-created_at')
    return render(request, 'core/manage_announcements.html', {'announcements': announcements})

@user_passes_test(lambda u: u.is_staff)
def add_announcement(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        content = request.POST.get('content')
        time_of_day = request.POST.get('time_of_day')
        if title and content and time_of_day:
            Announcement.objects.create(
                title=title, content=content, time_of_day=time_of_day
            )
            return redirect('manage_announcements')
    return redirect('manage_announcements')

@user_passes_test(lambda u: u.is_staff)
def delete_announcement(request, announcement_id):
    if request.method == 'POST':
        Announcement.objects.filter(id=announcement_id).delete()
    return redirect('manage_announcements')
