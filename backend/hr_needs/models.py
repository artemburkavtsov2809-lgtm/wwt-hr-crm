from django.db import models

class HRNeed(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Низький'),
        ('medium', 'Середній'),
        ('high', 'Високий'),
        ('critical', 'Критичний'),
    ]

    STATUS_CHOICES = [
        ('open', 'Відкрита'),
        ('in_progress', 'В процесі'),
        ('closed', 'Закрита'),
        ('on_hold', 'На паузі'),
    ]

    title = models.CharField(max_length=200)
    team = models.CharField(max_length=50)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    description = models.TextField(blank=True)
    required_count = models.PositiveIntegerField(default=1)
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title