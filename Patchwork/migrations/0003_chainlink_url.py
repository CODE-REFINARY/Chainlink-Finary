# Generated by Django 3.2.19 on 2023-06-27 05:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Patchwork', '0002_auto_20230625_2014'),
    ]

    operations = [
        migrations.AddField(
            model_name='chainlink',
            name='url',
            field=models.CharField(default=1111, max_length=75),
            preserve_default=False,
        ),
    ]