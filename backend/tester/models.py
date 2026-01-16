from django.db import models

class SpeedTestResult(models.Model):
    """
    Stores the results of a network speed test.
    """
    download_speed_mbps = models.FloatField(help_text="Download speed in Megabits per second (Mbps)")
    upload_speed_mbps = models.FloatField(help_text="Upload speed in Megabits per second (Mbps)")
    latency_ms = models.FloatField(help_text="Round-trip time (ping) in milliseconds")
    jitter_ms = models.FloatField(help_text="Variance in latency in milliseconds")
    isp_name = models.CharField(max_length=255, help_text="Detected Internet Service Provider")
    is_starlink = models.BooleanField(default=False, help_text="True if the ISP is identified as Starlink")
    client_ip = models.GenericIPAddressField(null=True, blank=True, help_text="Public IP address of the client")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.isp_name} - D:{self.download_speed_mbps} U:{self.upload_speed_mbps} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

    class Meta:
        ordering = ['-created_at']
