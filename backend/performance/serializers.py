from rest_framework import serializers
from .models import PerformanceReview

class PerformanceReviewSerializer(serializers.ModelSerializer):
    total_score = serializers.ReadOnlyField()

    class Meta:
        model = PerformanceReview
        fields = '__all__'