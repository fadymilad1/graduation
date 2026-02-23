from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import auth, website_setup, business_info

router = DefaultRouter()
router.register(r'website-setups', website_setup.WebsiteSetupViewSet, basename='websitesetup')
router.register(r'business-info', business_info.BusinessInfoViewSet, basename='businessinfo')

urlpatterns = [
    # Root endpoint
    path('', auth.api_root, name='api_root'),

    # Authentication
    path('auth/signup/', auth.signup, name='signup'),
    path('auth/login/', auth.login, name='login'),
    path('auth/me/', auth.get_current_user, name='get_current_user'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Include router URLs
    path('', include(router.urls)),
]
