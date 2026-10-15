from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Value
from django.db.models.fields import DecimalField
from django.db.models.functions import Coalesce
from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters import rest_framework as filters

from .serializers import (
    ChangePasswordSerializer,
    CustomerAdminSerializer,
    CustomerAdminUpdateSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class AdminCustomerPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50


class CustomerFilter(filters.FilterSet):
    is_active = filters.BooleanFilter(field_name='is_active')
    is_staff = filters.BooleanFilter(field_name='is_staff')
    joined_after = filters.DateFilter(field_name='date_joined', lookup_expr='gte')
    joined_before = filters.DateFilter(field_name='date_joined', lookup_expr='lte')
    min_total_spent = filters.NumberFilter(method='filter_min_total_spent')

    class Meta:
        model = User
        fields = ['is_active', 'is_staff', 'joined_after', 'joined_before']

    def filter_min_total_spent(self, queryset, name, value):
        return queryset.filter(total_spent__gte=value)


class CustomerAdminListView(generics.ListAPIView):
    serializer_class = CustomerAdminSerializer
    permission_classes = (permissions.IsAdminUser,)
    pagination_class = AdminCustomerPagination
    filterset_class = CustomerFilter
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['date_joined', 'order_count', 'total_spent']
    ordering = ['-date_joined']

    def get_queryset(self):
        return (
            User.objects.filter(is_staff=False)
            .annotate(
                order_count=Count('orders', distinct=True),
                total_spent=Coalesce(Sum('orders__total'), Value(0), output_field=DecimalField()),
            )
            .order_by('-date_joined')
        )


class CustomerAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAdminUser,)
    lookup_field = 'pk'

    def get_queryset(self):
        return (
            User.objects.filter(is_staff=False)
            .annotate(
                order_count=Count('orders', distinct=True),
                total_spent=Coalesce(Sum('orders__total'), Value(0), output_field=DecimalField()),
            )
        )

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return CustomerAdminUpdateSerializer
        return CustomerAdminSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'message': 'Compte créé avec succès.', 'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProfileUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Mot de passe modifié avec succès.'}, status=status.HTTP_200_OK)


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            from .serializers import UserSerializer
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(username=request.data.get('username'))
            data = response.data
            data['user'] = UserSerializer(user).data
            return Response(data)
        return response