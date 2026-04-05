from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg
from .models import Employee, Team
from .serializers import EmployeeSerializer, TeamSerializer

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'position', 'email', 'team']
    ordering_fields = ['last_name', 'hire_date', 'team', 'employee_id']

    def get_queryset(self):
        queryset = Employee.objects.all()
        team = self.request.query_params.get('team')
        status = self.request.query_params.get('status')
        nda = self.request.query_params.get('nda_status')
        risk = self.request.query_params.get('risk_level')
        hr = self.request.query_params.get('hr_responsible')
        if team: queryset = queryset.filter(team=team)
        if status: queryset = queryset.filter(status=status)
        if nda: queryset = queryset.filter(nda_status=nda)
        if risk: queryset = queryset.filter(risk_level=risk)
        if hr: queryset = queryset.filter(hr_responsible=hr)
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response({
            'total': Employee.objects.count(),
            'active': Employee.objects.filter(status='active').count(),
            'onboarding': Employee.objects.filter(status='onboarding').count(),
            'on_vacation': Employee.objects.filter(status='vacation').count(),
            'offboarding': Employee.objects.filter(status='offboarding').count(),
            'dismissed': Employee.objects.filter(status='dismissed').count(),
            'high_risk': Employee.objects.filter(risk_level='high').count(),
            'nda_not_signed': Employee.objects.filter(nda_status='not_signed').count(),
        })

    @action(detail=False, methods=['get'])
    def teams(self, request):
        teams = Team.objects.values_list('name', flat=True).order_by('name')
        return Response(list(teams))

    @action(detail=False, methods=['get'])
    def hrs(self, request):
        hrs = Employee.objects.values_list('hr_responsible', flat=True).distinct().order_by('hr_responsible')
        return Response(list(filter(None, hrs)))