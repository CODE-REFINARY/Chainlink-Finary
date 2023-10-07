from django.contrib import admin
from .models import Doc, Chainlink, Content, Account

admin.site.register(Doc)
admin.site.register(Chainlink)
admin.site.register(Content)
admin.site.register(Account)
