from rest_framework import serializers
from .models import HRNeed

class HRNeedSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRNeed
        fields = '__all__'