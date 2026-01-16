from django.urls import path
from .views import PingView, DownloadTestView, UploadTestView, NetworkInfoView

urlpatterns = [
    path('ping/', PingView.as_view(), name='ping'),
    path('download/', DownloadTestView.as_view(), name='download'),
    path('upload/', UploadTestView.as_view(), name='upload'),
    path('network-info/', NetworkInfoView.as_view(), name='network-info'),
]
