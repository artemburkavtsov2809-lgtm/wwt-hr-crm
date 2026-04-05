from rest_framework import serializers
from .models import CookiesChecklist

class CookiesChecklistSerializer(serializers.ModelSerializer):
    total_checked = serializers.ReadOnlyField()

    class Meta:
        model = CookiesChecklist
        fields = '__all__'