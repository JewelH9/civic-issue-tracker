import math

from rest_framework import viewsets, generics, permissions, status as http_status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Status, Issue, StatusHistory, Profile
from .serializers import (
    CategorySerializer,
    StatusSerializer,
    IssueSerializer,
    RegisterSerializer,
    StatusHistorySerializer,
    ProfileSerializer,
    UserAdminSerializer,
)
from .permissions import IsStaffOrAdmin, IsAdminRole


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (math.sin(d_phi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class StatusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer
    permission_classes = [permissions.AllowAny]


class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'status']

    def get_permissions(self):
        # Deleting an issue is a moderation action, not a regular CRUD
        # action — only staff/admin can do it. This overrides the
        # ViewSet-wide IsAuthenticatedOrReadOnly just for 'destroy'.
        if self.action == 'destroy':
            return [IsStaffOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        default_status = Status.objects.order_by('order').first()
        serializer.save(reported_by=self.request.user, status=default_status)

    def perform_destroy(self, instance):
        # Enforced server-side, not just hidden in the UI — an issue can
        # only be deleted once it has reached a terminal status (e.g. Resolved).
        # This preserves the audit trail for anything still in progress.
        if not instance.status.is_terminal:
            raise ValidationError(
                f"Cannot delete an issue with status '{instance.status.name}'. "
                f"Only issues in a terminal status (e.g. Resolved) can be deleted."
            )
        instance.delete()

    @action(detail=True, methods=['post'], url_path='change-status',
            permission_classes=[IsStaffOrAdmin])
    def change_status(self, request, pk=None):
        issue = self.get_object()
        new_status_id = request.data.get('new_status_id')
        note = request.data.get('note', '')

        if not new_status_id:
            return Response(
                {"error": "new_status_id is required"},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        new_status = get_object_or_404(Status, id=new_status_id)
        old_status = issue.status

        if not old_status.next_allowed_statuses.filter(id=new_status.id).exists():
            return Response(
                {
                    "error": f"Cannot transition from '{old_status.name}' to '{new_status.name}'. "
                             f"Allowed next statuses: "
                             f"{list(old_status.next_allowed_statuses.values_list('name', flat=True))}"
                },
                status=http_status.HTTP_400_BAD_REQUEST
            )

        issue.status = new_status
        issue.save()

        StatusHistory.objects.create(
            issue=issue,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            note=note,
        )

        serializer = self.get_serializer(issue)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        issue = self.get_object()
        history = issue.status_history.all()
        serializer = StatusHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='allowed-transitions',
            permission_classes=[IsStaffOrAdmin])
    def allowed_transitions(self, request, pk=None):
        issue = self.get_object()
        next_statuses = issue.status.next_allowed_statuses.all()
        serializer = StatusSerializer(next_statuses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='nearby')
    def nearby(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius_km = float(request.query_params.get('radius_km', 5))

        if not lat or not lng:
            return Response(
                {"error": "lat and lng query params are required"},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        lat, lng = float(lat), float(lng)
        lat_delta = radius_km / 111
        lng_delta = radius_km / (111 * math.cos(math.radians(lat)))

        candidates = Issue.objects.filter(
            latitude__range=(lat - lat_delta, lat + lat_delta),
            longitude__range=(lng - lng_delta, lng + lng_delta),
        )

        results = []
        for issue in candidates:
            dist = haversine_km(lat, lng, issue.latitude, issue.longitude)
            if dist <= radius_km:
                results.append((dist, issue))

        results.sort(key=lambda pair: pair[0])
        sorted_issues = [issue for _, issue in results]
        serializer = self.get_serializer(sorted_issues, many=True)
        return Response(serializer.data)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MyProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user.profile)
        return Response(serializer.data)

    def put(self, request):
        serializer = ProfileSerializer(request.user.profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminUserListView(generics.ListAPIView):
    """
    GET /api/admin/users/
    Lists every user with their current role and active/banned status.
    Admin-only — this is the moderation panel's data source.
    """
    queryset = User.objects.select_related('profile').all().order_by('-date_joined')
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminRole]


class AdminUserUpdateView(APIView):
    """
    PATCH  /api/admin/users/{id}/  -> update role / is_active
    DELETE /api/admin/users/{id}/  -> permanently delete the user

    Admin-only. Deleting a user cascades to every Issue they reported
    (Issue.reported_by uses on_delete=CASCADE) — this is destructive
    and irreversible, unlike banning (is_active=False), which is
    preferred in most cases. Kept here because moderators sometimes
    genuinely need hard-delete for spam/fake accounts.
    """
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        target_user = get_object_or_404(User, pk=pk)

        if target_user.id == request.user.id:
            return Response(
                {"error": "You cannot change your own role or active status here."},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        role = request.data.get('role')
        if role is not None:
            valid_roles = dict(Profile.ROLE_CHOICES)
            if role not in valid_roles:
                return Response(
                    {"error": f"Invalid role. Must be one of: {list(valid_roles.keys())}"},
                    status=http_status.HTTP_400_BAD_REQUEST
                )
            target_user.profile.role = role
            target_user.profile.save()

        is_active = request.data.get('is_active')
        if is_active is not None:
            target_user.is_active = bool(is_active)
            target_user.save()

        return Response(UserAdminSerializer(target_user).data)

    def delete(self, request, pk):
        target_user = get_object_or_404(User, pk=pk)

        if target_user.id == request.user.id:
            return Response(
                {"error": "You cannot delete your own account here."},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        if target_user.is_superuser:
            return Response(
                {"error": "Superuser accounts cannot be deleted through this panel."},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        username = target_user.username
        target_user.delete()  # cascades: deletes their Profile and reported Issues too

        return Response(
            {"message": f"User '{username}' and all their reported issues have been permanently deleted."},
            status=http_status.HTTP_200_OK
        )