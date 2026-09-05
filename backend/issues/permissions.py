from rest_framework import permissions


class IsStaffOrAdmin(permissions.BasePermission):
    """
    Only allows access to users whose Profile.role is 'staff' or 'admin'.
    Citizens are blocked. Falls back to deny if no profile exists.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if profile is None:
            return False
        return profile.role in ('staff', 'admin')
    

class IsAdminRole(permissions.BasePermission):
    """
    Only allows users whose Profile.role is exactly 'admin'.
    Stricter than IsStaffOrAdmin — user management and moderation
    actions should not be available to regular staff.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        return profile is not None and profile.role == 'admin'