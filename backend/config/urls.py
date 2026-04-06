from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse, HttpResponse
from django.db import connection
from rest_framework.routers import DefaultRouter
from rest_framework import viewsets, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.models import User
from employees.views import EmployeeViewSet, TeamViewSet
from hr_needs.views import HRNeedViewSet
from performance.views import PerformanceViewSet
from documents.views import CookiesChecklistViewSet


# ===================== HEALTH CHECKS =====================
def health_check(request):
    """Basic health check for Railway - MUST return 200 OK"""
    return HttpResponse("OK", status=200, content_type="text/plain")


def health_check_json(request):
    """Extended health check with database status"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return JsonResponse({
        "status": "ok",
        "database": db_status,
        "service": "wwt-hr-crm"
    }, status=200)


def ping(request):
    """Simple ping endpoint - no auth required"""
    return JsonResponse({"ping": "pong", "timestamp": 2026}, status=200)


# ===================== SERIALIZERS =====================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_superuser', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ===================== VIEWSETS =====================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


# ===================== API VIEWS =====================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email,
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
        'is_superuser': request.user.is_superuser,
        'is_staff': request.user.is_staff,
    })


# ===================== ROUTERS =====================
router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'hr-needs', HRNeedViewSet)
router.register(r'performance', PerformanceViewSet)
router.register(r'cookies', CookiesChecklistViewSet)
router.register(r'auth/users', UserViewSet)

# ===================== URL PATTERNS =====================
urlpatterns = [
    # Health checks - NO AUTH REQUIRED (must be first)
    path('', health_check, name='health_check'),
    path('health/', health_check, name='health_check_alt'),
    path('health/json/', health_check_json, name='health_check_json'),
    path('ping/', ping, name='ping'),

    # Admin
    path('admin/', admin.site.urls),

    # API endpoints
    path('api/', include(router.urls)),
    path('api/auth/me/', current_user, name='current_user'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Django REST Framework auth
    path('api-auth/', include('rest_framework.urls')),
]