from django.db import models

class Employee(models.Model):
    STATUS_CHOICES = [
        ('onboarding', 'Onboarding'),
        ('active', 'Працює'),
        ('vacation', 'Відпустка'),
        ('offboarding', 'До офбордингу'),
        ('dismissed', 'Покинув команду'),
    ]

    NDA_CHOICES = [
        ('signed', 'Підписано'),
        ('not_signed', 'Не підписано'),
        ('none', '—'),
    ]

    RISK_CHOICES = [
        ('', '—'),
        ('low', 'Низький'),
        ('medium', 'Середній'),
        ('high', 'Високий'),
    ]

    employee_id = models.PositiveIntegerField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    position = models.CharField(max_length=150, blank=True)
    team = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    status_details = models.TextField(blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    exit_date = models.DateField(null=True, blank=True)
    hr_responsible = models.CharField(max_length=100, blank=True)
    recruiter = models.CharField(max_length=100, blank=True)
    nda_status = models.CharField(max_length=20, choices=NDA_CHOICES, default='none', blank=True)
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES, default='', blank=True)
    calendly_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    avatar_color = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['team', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def initials(self):
        parts = [self.first_name, self.last_name]
        return ''.join(p[0] for p in parts if p)

    def save(self, *args, **kwargs):
        if not self.employee_id:
            last = Employee.objects.filter(
                employee_id__isnull=False
            ).order_by('-employee_id').first()
            self.employee_id = (last.employee_id + 1) if last else 1
        super().save(*args, **kwargs)

class Team(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name