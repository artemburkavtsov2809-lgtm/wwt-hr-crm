from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CookiesChecklist
from .serializers import CookiesChecklistSerializer

class CookiesChecklistViewSet(viewsets.ModelViewSet):
    queryset = CookiesChecklist.objects.all()
    serializer_class = CookiesChecklistSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee_name', 'team']

    def get_queryset(self):
        queryset = CookiesChecklist.objects.all()
        team = self.request.query_params.get('team')
        year = self.request.query_params.get('year')
        if team: queryset = queryset.filter(team=team)
        if year: queryset = queryset.filter(year=year)
        return queryset

    @action(detail=False, methods=['get'])
    def teams(self, request):
        teams = CookiesChecklist.objects.values_list('team', flat=True).distinct().order_by('team')
        return Response(list(filter(None, teams)))