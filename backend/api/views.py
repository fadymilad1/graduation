from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.http import JsonResponse
from .models import User, WebsiteSetup, BusinessInfo
from .serializers import (
    UserSerializer, SignupSerializer, WebsiteSetupSerializer,
    BusinessInfoSerializer, BusinessInfoCreateUpdateSerializer
)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_root(request):
    """Root endpoint showing API information"""
    return Response({
        'message': 'Medify Backend API',
        'version': '1.0.0',
        'endpoints': {
            'authentication': {
                'signup': '/api/auth/signup/',
                'login': '/api/auth/login/',
                'me': '/api/auth/me/',
                'refresh': '/api/auth/refresh/',
            },
            'website_setup': {
                'get': '/api/website-setups/',
                'update': '/api/website-setups/',
            },
            'business_info': {
                'get': '/api/business-info/',
                'create': '/api/business-info/',
                'update': '/api/business-info/',
                'publish': '/api/business-info/publish/',
            },
            'admin': '/admin/',
        },
        'documentation': 'See README.md for detailed API documentation',
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def signup(request):
    """User registration endpoint"""
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Create website setup for the user
        website_setup = WebsiteSetup.objects.create(user=user)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'website_setup_id': str(website_setup.id),
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """User login endpoint"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=email, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            },
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


class WebsiteSetupViewSet(viewsets.ModelViewSet):
    """ViewSet for WebsiteSetup"""
    serializer_class = WebsiteSetupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return website setup for the current user"""
        return WebsiteSetup.objects.filter(user=self.request.user)

    def get_object(self):
        """Get or create website setup for current user"""
        setup, created = WebsiteSetup.objects.get_or_create(user=self.request.user)
        return setup

    def list(self, request, *args, **kwargs):
        """Get user's website setup"""
        setup = self.get_object()
        serializer = self.get_serializer(setup)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Get user's website setup"""
        setup = self.get_object()
        serializer = self.get_serializer(setup)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Update user's website setup"""
        setup = self.get_object()
        serializer = self.get_serializer(setup, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class BusinessInfoViewSet(viewsets.ModelViewSet):
    """ViewSet for BusinessInfo"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return business info for the current user's website setup"""
        try:
            website_setup = WebsiteSetup.objects.get(user=self.request.user)
            return BusinessInfo.objects.filter(website_setup=website_setup)
        except WebsiteSetup.DoesNotExist:
            return BusinessInfo.objects.none()

    def get_serializer_class(self):
        """Use different serializer for create/update"""
        if self.action in ['create', 'update', 'partial_update']:
            return BusinessInfoCreateUpdateSerializer
        return BusinessInfoSerializer

    def get_object(self):
        """Get or create business info for current user's website setup"""
        website_setup = WebsiteSetup.objects.get(user=self.request.user)
        business_info, created = BusinessInfo.objects.get_or_create(
            website_setup=website_setup
        )
        return business_info

    def list(self, request, *args, **kwargs):
        """Get user's business info"""
        business_info = self.get_object()
        serializer = self.get_serializer(business_info, context={'request': request})
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Get user's business info"""
        business_info = self.get_object()
        serializer = self.get_serializer(business_info, context={'request': request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create business info for user's website setup"""
        website_setup = WebsiteSetup.objects.get(user=request.user)
        
        # Check if business info already exists
        if BusinessInfo.objects.filter(website_setup=website_setup).exists():
            return Response(
                {'error': 'Business info already exists. Use update endpoint.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(website_setup=website_setup)
        
        # Return with full serializer
        business_info = BusinessInfo.objects.get(website_setup=website_setup)
        response_serializer = BusinessInfoSerializer(
            business_info,
            context={'request': request}
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update user's business info"""
        business_info = self.get_object()
        serializer = self.get_serializer(business_info, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Return with full serializer
        response_serializer = BusinessInfoSerializer(
            business_info,
            context={'request': request}
        )
        return Response(response_serializer.data)

    @action(detail=False, methods=['post'])
    def publish(self, request):
        """Publish the website"""
        business_info = self.get_object()
        business_info.is_published = True
        business_info.save()
        
        serializer = self.get_serializer(business_info, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

