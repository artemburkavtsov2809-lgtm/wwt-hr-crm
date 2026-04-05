from django.contrib import admin
from .models import PerformanceReview

@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ['employee_name', 'team', 'reviewer', 'date', 'responsibility', 'teamwork', 'tech_skills', 'vibe']
    list_filter = ['team', 'date']
    search_fields = ['employee_name', 'reviewer']