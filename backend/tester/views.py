import os
import time
import requests
from django.http import StreamingHttpResponse, HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import BaseParser

# If ipware is not installed, I'll write a simple helper. 
# Prompt didn't mention ipware, so I'll write a manual helper to be safe.

from .models import SpeedTestResult
from .serializers import SpeedTestResultSerializer, NetworkInfoSerializer

# --- Utilities ---

def get_client_ip_address(request):
    """
    Manually retrieve client IP. 
    In prod, this should rely on X-Forwarded-For if behind Nginx/load balancer.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_isp_info(ip_address):
    """
    Detects ISP using an external service.
    Note: For local development (127.0.0.1), this will return mock data.
    """
    if ip_address in ('127.0.0.1', '::1'):
        return {
            "query": ip_address,
            "status": "success",
            "isp": "Localhost Development",
            "org": "SpaceX Starlink (Mock)", # Mocking for dev verification
            "as": "AS14593 SpaceX Starlink"  # Mocking ASN
        }
    
    # Use a free API for demo purposes (e.g., ip-api.com).
    # In production, use a paid/reliable db (MaxMind).
    try:
        response = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=3)
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    
    return {"isp": "Unknown", "org": "Unknown"}

# --- Parsers ---

class BinaryParser(BaseParser):
    """
    Plain binary parser for upload testing. 
    It doesn't actually read the content into `request.data` to save memory 
    if we handle `request.stream` manually, but DRF expects `parse` to return data.
    For the upload test, we might bypass DRF parsing or use this to allow any content type.
    """
    media_type = '*/*'
    
    def parse(self, stream, media_type=None, parser_context=None):
        return stream

# --- Views ---

class PingView(APIView):
    """
    Lightweight endpoint for Latency/Jitter measurement.
    Returns 204 No Content immediately.
    """
    authentication_classes = [] # Public
    permission_classes = []

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


class DownloadTestView(APIView):
    """
    Serves non-compressible random binary data for download speed testing.
    Uses os.urandom() to bypass ISP compression.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        # Default 10MB, max 100MB to prevent abuse
        try:
            size = int(request.query_params.get('size', 10 * 1024 * 1024))
            size = min(size, 100 * 1024 * 1024) # Cap at 100MB
        except ValueError:
            size = 10 * 1024 * 1024

        def file_iterator(file_size, chunk_size=65536):
            """
            Generator that yields random bytes.
            Chunk size 64KB is a balance between too many system calls and memory usage.
            """
            bytes_generated = 0
            while bytes_generated < file_size:
                needed = file_size - bytes_generated
                # serve min(chunk, needed)
                payload = os.urandom(min(chunk_size, needed))
                bytes_generated += len(payload)
                yield payload

        response = StreamingHttpResponse(
            file_iterator(size),
            content_type='application/octet-stream'
        )
        response['Content-Length'] = size
        # Strict headers to prevent caching
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response


class UploadTestView(APIView):
    """
    Receives large binary POST for upload speed testing.
    Discards data as it arrives to minimize memory footprint.
    """
    authentication_classes = []
    permission_classes = []
    parser_classes = [BinaryParser]

    def post(self, request):
        # Time the reception
        start_time = time.time()
        
        # We need to read the stream.
        # request.data from BinaryParser is the stream itself if we set it up right, 
        # but DRF might have read it.
        # If BinaryParser returns stream, we can iterate.
        stream = request.data
        
        total_bytes = 0
        if hasattr(stream, 'read'):
            # It's a file-like object / stream
            # Read in chunks
            while True:
                chunk = stream.read(65536)
                if not chunk:
                    break
                total_bytes += len(chunk)
        else:
            # Maybe it's already bytes (small payload?)
            # Or DRF behavior depending on settings.
            # Fallback for safety:
            if isinstance(stream, bytes):
                total_bytes = len(stream)
        
        duration = time.time() - start_time
        
        # Calculate speed roughly (frontend usually does the real calc, but we can return stats)
        # Avoid division by zero
        if duration == 0:
            duration = 0.0001
        
        mbps = (total_bytes * 8) / (duration * 1000000)
        
        return Response({
            "received_bytes": total_bytes,
            "duration_seconds": duration,
            "calculated_mbps": mbps
        }, status=status.HTTP_200_OK)


class NetworkInfoView(APIView):
    """
    Returns public IP and ISP details.
    Used to verify if the user is on Starlink.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        ip = get_client_ip_address(request)
        isp_data = get_isp_info(ip)
        
        # Check for Starlink signature
        # ASN 14593 is SpaceX Starlink
        isp_name = isp_data.get('isp', '') or isp_data.get('org', '')
        # Check if "SpaceX" or "Starlink" is in the name/organization
        # or check specific AS number if available from API
        is_starlink = False
        if "Starlink" in isp_name or "SpaceX" in isp_name:
            is_starlink = True
        
        # For our mock 127.0.0.1 case:
        if isp_data.get('as') and "14593" in isp_data.get('as'):
            is_starlink = True

        data = {
            "ip": ip,
            "isp": isp_name,
            "is_starlink": is_starlink,
            "details": str(isp_data)
        }
        serializer = NetworkInfoSerializer(data)
        return Response(serializer.data)