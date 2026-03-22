from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()

class Feature(models.Model):
    user = models.OneToOneField(User,on_delete=models.CASCADE)

    review_system = models.BooleanField(default=False)
    ai_chatbot = models.BooleanField(default=False)
    patient_portal = models.BooleanField(default=False)
    file_upload = models.BooleanField(default=False)
    prescription_refill = models.BooleanField(default=False)

    created_at =models.DateTimeField(auto_now_add=True)
    updated_at =models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} Features"
