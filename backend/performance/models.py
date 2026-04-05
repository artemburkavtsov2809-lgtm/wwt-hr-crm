from django.db import models

class PerformanceReview(models.Model):
    # Персональна інформація
    date = models.DateField()
    reviewer = models.CharField(max_length=200)
    employee_name = models.CharField(max_length=200)
    team = models.CharField(max_length=50, blank=True)

    # Скіли (1-5)
    responsibility = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    teamwork = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    learning_speed = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    engineering = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    tech_skills = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    availability = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    vibe = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', 'team', 'employee_name']

    def __str__(self):
        return f"{self.employee_name} — {self.team} — {self.date}"

    @property
    def total_score(self):
        scores = [self.responsibility, self.teamwork, self.learning_speed,
                  self.engineering, self.tech_skills, self.vibe]
        valid = [float(s) for s in scores if s is not None]
        if not valid:
            return None
        return round(sum(valid) / len(valid), 2)