from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.decorators import login_required
from .models import WatchItem, Review

@login_required
def index(request):
    watchlist = WatchItem.objects.all().order_by('is_watched', '-created_at')
    return render(request, 'watchlist/index.html', {'watchlist': watchlist})

@login_required
def add_item(request):
    if request.method == 'POST':
        WatchItem.objects.create(
            title=request.POST.get('title'),
            item_type=request.POST.get('item_type'),
            rating=request.POST.get('rating', 0),
            comment=request.POST.get('comment', ''),
            added_by=request.user
        )
    return redirect('watchlist_index')

@login_required
def delete_item(request, item_id):
    item = get_object_or_404(WatchItem, id=item_id)
    item.delete()
    return redirect('watchlist_index')

@login_required
def toggle_watched(request, item_id):
    item = get_object_or_404(WatchItem, id=item_id)
    item.is_watched = not item.is_watched
    item.save()
    return redirect('watchlist_index')

@login_required
def add_review(request, item_id):
    item = get_object_or_404(WatchItem, id=item_id)
    if request.method == 'POST':
        rating = int(request.POST.get('rating', 0))
        comment = request.POST.get('comment', '')
        # Update or create review (one per user)
        Review.objects.update_or_create(
            watch_item=item, user=request.user,
            defaults={'rating': rating, 'comment': comment}
        )
    return redirect('watchlist_index')
