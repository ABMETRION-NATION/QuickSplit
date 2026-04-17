"""
Backend API tests for QuickSplit
Tests the 3 scaffold endpoints: /, /health, /sync/status
"""
import os
import pytest
import requests
from pathlib import Path

# Get backend URL from frontend .env file
def get_backend_url():
    env_file = Path('/app/frontend/.env')
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                return line.split('=', 1)[1].strip().rstrip('/')
    return ''

BASE_URL = get_backend_url()

class TestBackendHealth:
    """Health check and root endpoint tests"""

    def test_root_endpoint(self):
        """Test GET /api/ returns service info"""
        response = requests.get(f"{BASE_URL}/api/", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Response missing 'status' field"
        assert data["status"] == "ok", f"Expected status 'ok', got {data['status']}"
        assert "service" in data, "Response missing 'service' field"
        assert "QuickSplit" in data["service"], "Service name should contain 'QuickSplit'"
        assert "time" in data, "Response missing 'time' field"
        print(f"✓ Root endpoint working: {data}")

    def test_health_endpoint(self):
        """Test GET /api/health returns ok status"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Response missing 'status' field"
        assert data["status"] == "ok", f"Expected status 'ok', got {data['status']}"
        assert "service" in data, "Response missing 'service' field"
        assert "time" in data, "Response missing 'time' field"
        print(f"✓ Health endpoint working: {data}")

    def test_sync_status_endpoint(self):
        """Test GET /api/sync/status returns disabled status"""
        response = requests.get(f"{BASE_URL}/api/sync/status", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "enabled" in data, "Response missing 'enabled' field"
        assert data["enabled"] is False, "Sync should be disabled in v1"
        assert "message" in data, "Response missing 'message' field"
        print(f"✓ Sync status endpoint working: {data}")

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session
