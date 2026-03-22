from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'website-setups', views.WebsiteSetupViewSet, basename='websitesetup')
router.register(r'business-info', views.BusinessInfoViewSet, basename='businessinfo')

urlpatterns = [
    # Root endpoint
    path('', views.api_root, name='api_root'),
    
    # Authentication
    path('auth/signup/', views.signup, name='signup'),
    path('auth/login/', views.login, name='login'),
    path('auth/me/', views.get_current_user, name='get_current_user'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Include router URLs
    path('', include(router.urls)),
]

