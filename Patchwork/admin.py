from django.contrib import admin
from .models import Collection, Chainlink, Content, Account, Header, Footer

admin.site.register(Collection)
admin.site.register(Chainlink)
admin.site.register(Content)
admin.site.register(Account)
admin.site.register(Header)
admin.site.register(Footer)
