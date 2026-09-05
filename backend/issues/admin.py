from django.contrib import admin
from .models import Profile, Category, Status, Issue, StatusHistory


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone')
    list_filter = ('role',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon')
    search_fields = ('name',)


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_terminal', 'color')
    ordering = ('order',)
    filter_horizontal = ('next_allowed_statuses',)  # nicer widget for the M2M field


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'status', 'reported_by', 'assigned_to', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('title', 'description', 'address')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(StatusHistory)
class StatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('issue', 'old_status', 'new_status', 'changed_by', 'changed_at')
    readonly_fields = ('changed_at',)