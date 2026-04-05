from django.db import models

class CookiesChecklist(models.Model):
    employee_name = models.CharField(max_length=200)
    team = models.CharField(max_length=50, blank=True)
    year = models.PositiveIntegerField(default=2026)

    january = models.BooleanField(default=False)
    february = models.BooleanField(default=False)
    march = models.BooleanField(default=False)
    april = models.BooleanField(default=False)
    may = models.BooleanField(default=False)
    june = models.BooleanField(default=False)
    july = models.BooleanField(default=False)
    august = models.BooleanField(default=False)
    september = models.BooleanField(default=False)
    october = models.BooleanField(default=False)
    november = models.BooleanField(default=False)
    december = models.BooleanField(default=False)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['team', 'employee_name']
        unique_together = ['employee_name', 'year']

    def __str__(self):
        return f"{self.employee_name} — {self.year}"

    @property
    def total_checked(self):
        months = [self.january, self.february, self.march, self.april,
                  self.may, self.june, self.july, self.august,
                  self.september, self.october, self.november, self.december]
        return sum(1 for m in months if m)