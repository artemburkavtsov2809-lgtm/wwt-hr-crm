from django.contrib import admin
from .models import HRNeed

@admin.register(HRNeed)
class HRNeedAdmin(admin.ModelAdmin):
    list_display = ['title', 'team', 'priority', 'status']
    list_filter = ['priority', 'status']