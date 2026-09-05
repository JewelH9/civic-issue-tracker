from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Category, Status, Issue, StatusHistory


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon']


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ['id', 'name', 'order', 'is_terminal', 'color']
        # note: deliberately NOT exposing next_allowed_statuses here yet —
        # that's workflow logic, not something the public API needs to leak


class UserMiniSerializer(serializers.ModelSerializer):
    """A trimmed-down user representation — we never want to expose
    password hashes or email by default in nested responses."""
    class Meta:
        model = User
        fields = ['id', 'username']


class IssueSerializer(serializers.ModelSerializer):
    # READ side: full nested objects
    category = CategorySerializer(read_only=True)
    status = StatusSerializer(read_only=True)
    reported_by = UserMiniSerializer(read_only=True)
    assigned_to = UserMiniSerializer(read_only=True)

    # WRITE side: just accept an id, DRF maps it to the FK automatically
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description',
            'category', 'category_id',
            'status',
            'latitude', 'longitude', 'address',
            'photo',
            'reported_by', 'assigned_to',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['status', 'reported_by', 'assigned_to', 'created_at', 'updated_at']
        # status is read-only here on purpose — a citizen creating an issue
        # should NOT be able to set its status directly. We'll default it
        # to "Reported" in the view instead. Status changes go through a
        # separate endpoint later (Phase 4/5) that also writes StatusHistory.


class StatusHistorySerializer(serializers.ModelSerializer):
    old_status = StatusSerializer(read_only=True)
    new_status = StatusSerializer(read_only=True)
    changed_by = UserMiniSerializer(read_only=True)

    class Meta:
        model = StatusHistory
        fields = ['id', 'issue', 'old_status', 'new_status', 'changed_by', 'note', 'changed_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],  # create_user hashes this automatically
        )
        Profile.objects.create(user=user, role='citizen')
        return user
    
class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(read_only=True)

    class Meta:
        model = Profile
        fields = [
            'username', 'email', 'role', 'phone',
            'aadhaar_number', 'date_of_birth', 'address',
        ]
        

class UserAdminSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    issue_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'role', 'date_joined', 'issue_count']

    def get_role(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.role if profile else None

    def get_issue_count(self, obj):
        return obj.reported_issues.count()