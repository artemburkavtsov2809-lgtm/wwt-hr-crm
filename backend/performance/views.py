from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg
from .models import PerformanceReview
from .serializers import PerformanceReviewSerializer

class PerformanceViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.all()
    serializer_class = PerformanceReviewSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee_name', 'reviewer', 'team']

    def get_queryset(self):
        queryset = PerformanceReview.objects.all()
        team = self.request.query_params.get('team')
        employee = self.request.query_params.get('employee_name')
        reviewer = self.request.query_params.get('reviewer')
        if team: queryset = queryset.filter(team=team)
        if employee: queryset = queryset.filter(employee_name__icontains=employee)
        if reviewer: queryset = queryset.filter(reviewer__icontains=reviewer)
        return queryset

    @action(detail=False, methods=['get'])
    def teams(self, request):
        teams = PerformanceReview.objects.values_list('team', flat=True).distinct().order_by('team')
        return Response(list(filter(None, teams)))

    @action(detail=False, methods=['get'])
    def summary(self, request):
        team = self.request.query_params.get('team')
        qs = PerformanceReview.objects.all()
        if team:
            qs = qs.filter(team=team)
        avg = qs.aggregate(
            avg_responsibility=Avg('responsibility'),
            avg_teamwork=Avg('teamwork'),
            avg_learning=Avg('learning_speed'),
            avg_engineering=Avg('engineering'),
            avg_tech=Avg('tech_skills'),
            avg_availability=Avg('availability'),
            avg_vibe=Avg('vibe'),
        )
        return Response(avg)