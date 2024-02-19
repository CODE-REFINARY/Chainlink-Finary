from django.conf import settings # import the settings file

def react_static(request):
    # return the value you want as a dictionary. you may add multiple values in there.
    return {'REACT_STATIC_ROOT': settings.REACT_STATIC_ROOT}
