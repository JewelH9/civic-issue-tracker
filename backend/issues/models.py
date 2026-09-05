from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    ROLE_CHOICES = [
        ('citizen', 'Citizen'),
        ('staff', 'Staff'),
        ('admin', 'Admin'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    phone = models.CharField(max_length=20, blank=True)

    # --- Government verification fields ---
    # These are private by design: never serialized in any public-facing
    # endpoint (Issue, StatusHistory, etc). Only exposed via the
    # "my profile" endpoint, and only to the profile's own owner.
    aadhaar_number = models.CharField(
        max_length=12, blank=True,
        help_text="12-digit Aadhaar number. Never exposed publicly."
    )
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Category(models.Model):
    """
    Pothole, Streetlight, Garbage, etc.
    Kept as its own model (not choices) because this list
    genuinely grows over time and admins should manage it.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name for frontend, e.g. 'road', 'lightbulb'")

    class Meta:
        verbose_name_plural = "Categories"  # Django would otherwise say "Categorys"

    def __str__(self):
        return self.name


class Status(models.Model):
    """
    Reported, Acknowledged, In Progress, Resolved, Rejected...
    This is the FK-based workflow model we chose over hardcoded choices.
    """
    name = models.CharField(max_length=50, unique=True)
    order = models.PositiveIntegerField(
        default=0,
        help_text="Sort order in the workflow pipeline, e.g. 1=Reported, 2=Acknowledged"
    )
    is_terminal = models.BooleanField(
        default=False,
        help_text="If true, no further status changes are expected (e.g. Resolved, Rejected)"
    )
    color = models.CharField(
        max_length=7, default="#6B7280",
        help_text="Hex color for UI badges, e.g. #22C55E"
    )
    next_allowed_statuses = models.ManyToManyField(
        'self', symmetrical=False, blank=True,
        help_text="Which statuses this can transition INTO"
    )

    class Meta:
        ordering = ['order']
        verbose_name_plural = "Statuses"

    def __str__(self):
        return self.name


class Issue(models.Model):
    """
    The core entity: a citizen-reported civic issue.
    """
    title = models.CharField(max_length=200)
    description = models.TextField()

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='issues')
    status = models.ForeignKey(Status, on_delete=models.PROTECT, related_name='issues')

    # Location — plain floats for now, no PostGIS setup needed yet
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=255, blank=True)

    photo = models.ImageField(upload_to='issue_photos/', blank=True, null=True)

    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_issues')
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_issues',
        help_text="Staff member responsible for resolving this"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']  # newest issues first by default

    def __str__(self):
        return f"{self.title} [{self.status.name}]"


class StatusHistory(models.Model):
    """
    Audit trail: every status change on an Issue is logged here
    instead of just overwriting Issue.status.
    This is what lets us later build a timeline UI and metrics like
    'average time from Reported to Resolved'.
    """
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.ForeignKey(
        Status, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+'  # we don't need a reverse relation for this one
    )
    new_status = models.ForeignKey(Status, on_delete=models.PROTECT, related_name='+')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    note = models.TextField(blank=True, help_text="Optional comment explaining the change")
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
        verbose_name_plural = "Status histories"

    def __str__(self):
        return f"{self.issue.title}: {self.old_status} → {self.new_status}"