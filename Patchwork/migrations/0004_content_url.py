# Generated by Django 3.2.19 on 2023-06-27 16:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Patchwork', '0003_chainlink_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='content',
            name='url',
            field=models.CharField(default=1234, max_length=75),
            preserve_default=False,
        ),
    ]