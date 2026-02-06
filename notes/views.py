from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Note
import json

@login_required
def index(request):
    notes = Note.objects.filter(user=request.user).order_by('-updated_at')
    return render(request, 'notes/index.html', {'notes': notes})

@login_required
def manage_note(request, note_id=None):
    if request.method == 'POST':
        if note_id:
            # Update existing note
            note = get_object_or_404(Note, id=note_id, user=request.user)
            if 'delete' in request.POST:
                note.delete()
            else:
                note.content = request.POST.get('content')
                note.save()
        else:
            # Create new note
            content = request.POST.get('content')
            if content:
                Note.objects.create(user=request.user, content=content)
        return redirect('notes_index')
    
    return redirect('notes_index')
