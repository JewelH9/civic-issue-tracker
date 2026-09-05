from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, StatusViewSet, IssueViewSet, RegisterView,
    MyProfileView, AdminUserListView, AdminUserUpdateView,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('statuses', StatusViewSet)
router.register('issues', IssueViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/me/', MyProfileView.as_view(), name='my-profile'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserUpdateView.as_view(), name='admin-user-update'),
] + router.urls