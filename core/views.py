from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required, user_passes_test
from .models import DailyPhrase, Announcement, Mood, MoodEntry
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

    # Mood Logic
    latest_my_mood = MoodEntry.objects.filter(user=request.user).order_by('-created_at').first()
    latest_other_mood = MoodEntry.objects.exclude(user=request.user).order_by('-created_at').first()
    
    # Background Gradient Logic based on latest_my_mood
    bg_gradient = "linear-gradient(-45deg, #96a977, #81c784, #007F7A, #26a69a)" # Default
    if latest_my_mood:
        gradients = {
            'happy': "linear-gradient(135deg, #fff9c4 0%, #ffeb3b 50%, #fbc02d 100%)", # Gold/Yellow
            'feliz': "linear-gradient(135deg, #fff9c4 0%, #ffeb3b 50%, #fbc02d 100%)", # Gold/Yellow
            
            'calm': "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)", # Sky Blue
            'calmado': "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)", # Sky Blue
            
            'tired': "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #bdbdbd 100%)", # Soft Gray
            'cansado': "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #bdbdbd 100%)", # Soft Gray
            
            'sad': "linear-gradient(135deg, #c5cae9 0%, #9fa8da 50%, #7986cb 100%)", # Indigo/Lavenderish
            'triste': "linear-gradient(135deg, #c5cae9 0%, #9fa8da 50%, #7986cb 100%)", # Indigo/Lavenderish
            
            'angry': "linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 50%, #e57373 100%)", # Soft Red
            'enojado': "linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 50%, #e57373 100%)", # Soft Red
            
            'love': "linear-gradient(135deg, #f8bbd0 0%, #f48fb1 50%, #f06292 100%)", # Rose/Pink
            'amoroso': "linear-gradient(135deg, #f8bbd0 0%, #f48fb1 50%, #f06292 100%)", # Rose/Pink
        }
        bg_gradient = gradients.get(latest_my_mood.mood, bg_gradient)
    
    context = {
        'hero_phrase': hero_phrase,
        'announcement': announcement,
        'latest_my_mood': latest_my_mood,
        'latest_other_mood': latest_other_mood,
        'bg_gradient': bg_gradient,
    }
    return render(request, 'dashboard.html', context)

@login_required(login_url='login')
def create_mood(request):
    if request.method == 'POST':
        mood = request.POST.get('mood')
        note = request.POST.get('note', '').strip()
        if mood in [choice[0] for choice in MoodEntry.MOOD_CHOICES]:
            MoodEntry.objects.create(
                user=request.user,
                mood=mood,
                note=note[:255]
            )
    return redirect('home')

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
