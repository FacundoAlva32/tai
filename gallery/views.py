from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Photo

@login_required
def index(request):
    photos = Photo.objects.all().order_by('-created_at')
    return render(request, 'gallery/index.html', {'photos': photos})

@login_required
def photo_detail(request, photo_id):
    photo = get_object_or_404(Photo, id=photo_id)
    if request.method == 'POST':
        if 'delete' in request.POST:
            photo.delete()
            return redirect('gallery_index')
        else:
            description = request.POST.get('description')
            photo.description = description
            photo.save()
            return redirect('photo_detail', photo_id=photo.id)
            
    return render(request, 'gallery/detail.html', {'photo': photo})

@login_required
def upload_photo(request):
    if request.method == 'POST' and request.FILES.get('image'):
        Photo.objects.create(
            image=request.FILES['image'],
            description=request.POST.get('description', ''),
            uploader=request.user
        )
    return redirect('gallery_index')

@login_required
def delete_photo(request, photo_id):
    photo = get_object_or_404(Photo, id=photo_id)
    photo.delete()
    return redirect('gallery_index')
