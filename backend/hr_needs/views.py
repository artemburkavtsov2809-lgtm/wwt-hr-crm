from rest_framework import viewsets, filters
from .models import HRNeed
from .serializers import HRNeedSerializer

class HRNeedViewSet(viewsets.ModelViewSet):
    queryset = HRNeed.objects.all()
    serializer_class = HRNeedSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'team']

    def get_queryset(self):
        queryset = HRNeed.objects.all()
        status = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        if status:
            queryset = queryset.filter(status=status)
        if priority:
            queryset = queryset.filter(priority=priority)
        return queryset