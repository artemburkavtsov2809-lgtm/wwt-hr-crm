from django.contrib import admin
from .models import Employee, Team

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'team', 'position', 'status', 'hr_responsible', 'nda_status', 'risk_level', 'hire_date']
    list_filter = ['team', 'status', 'nda_status', 'risk_level', 'hr_responsible']
    search_fields = ['first_name', 'last_name', 'email', 'position']
    ordering = ['team', 'last_name']