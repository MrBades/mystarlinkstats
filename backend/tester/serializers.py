from rest_framework import serializers
from .models import SpeedTestResult

class SpeedTestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpeedTestResult
        fields = [
            'id', 'download_speed_mbps', 'upload_speed_mbps', 
            'latency_ms', 'jitter_ms', 'isp_name', 'is_starlink', 
            'client_ip', 'created_at'
        ]
        read_only_fields = ['created_at']

class NetworkInfoSerializer(serializers.Serializer):
    ip = serializers.IPAddressField()
    isp = serializers.CharField()
    is_starlink = serializers.BooleanField()
    details = serializers.CharField(required=False)
