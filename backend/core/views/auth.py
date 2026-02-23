from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from core.models import WebsiteSetup
from core.serializers import UserSerializer, SignupSerializer


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_root(request):
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
            'website_setup': '/api/website-setups/',
            'business_info': '/api/business-info/',
            'admin': '/admin/',
        },
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        website_setup = WebsiteSetup.objects.create(user=user, subdomain=user.email.split('@')[0])
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
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
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(username=email, password=password)
    if user is None:
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user, context={'request': request}).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        },
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_current_user(request):
    return Response(UserSerializer(request.user, context={'request': request}).data)
