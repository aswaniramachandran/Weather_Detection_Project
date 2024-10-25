from django.contrib import admin

from weather.models import DailySummary, Weather

admin.site.register(Weather)

admin.site.register(DailySummary)
