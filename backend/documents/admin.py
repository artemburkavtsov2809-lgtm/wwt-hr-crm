from django.contrib import admin
from .models import CookiesChecklist

@admin.register(CookiesChecklist)
class CookiesChecklistAdmin(admin.ModelAdmin):
    list_display = ['employee_name', 'team', 'year', 'total_checked']
    list_filter = ['team', 'year']
    search_fields = ['employee_name']