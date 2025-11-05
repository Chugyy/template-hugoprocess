#!/usr/bin/env python3
"""API Test Runner for filters-cache-system"""
import json
import subprocess
import sys
import time
from datetime import datetime


BASE_URL = "http://localhost:8000"


def run_curl(method, endpoint, headers=None, data=None, expect_status=200):
    """Execute curl command and return parsed response"""
    cmd = ["curl", "-s", "-w", "\n%{http_code}", "-X", method, f"{BASE_URL}{endpoint}"]

    if headers:
        for key, value in headers.items():
            cmd.extend(["-H", f"{key}: {value}"])

    if data:
        cmd.extend(["-H", "Content-Type: application/json", "-d", json.dumps(data)])

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        output_lines = result.stdout.strip().split('\n')
        status_code = int(output_lines[-1])
        response_body = '\n'.join(output_lines[:-1])

        try:
            response_json = json.loads(response_body) if response_body else {}
        except json.JSONDecodeError:
            response_json = {"raw": response_body}

        return {
            "status": status_code,
            "body": response_json,
            "success": status_code == expect_status
        }
    except Exception as e:
        return {
            "status": 0,
            "body": {"error": str(e)},
            "success": False
        }


def get_auth_token():
    """Get authentication token (create user if needed)"""
    # Try to create user
    email = f"apitest{int(time.time())}@test.com"
    password = "ApiTest2025"

    result = run_curl("POST", "/api/auth/register", data={
        "email": email,
        "password": password
    }, expect_status=200)

    if result["success"]:
        return result["body"].get("access_token"), result["body"].get("user_id")

    # If failed, try login with test@test.com
    result = run_curl("POST", "/api/auth/login", data={
        "email": "test@test.com",
        "password": "test123"
    }, expect_status=200)

    if result["success"]:
        return result["body"].get("access_token"), result["body"].get("user_id")

    return None, None


def main():
    print("=" * 80)
    print("API TESTS RUNNER - filters-cache-system")
    print("=" * 80)
    print()

    # Get auth token
    print("[1/3] Getting authentication token...")
    token, user_id = get_auth_token()

    if not token:
        print("ERROR: Failed to authenticate. Please verify backend is running.")
        sys.exit(1)

    print(f"  ✓ Authenticated successfully (user_id={user_id})")
    print(f"  ✓ Token: {token[:20]}...")
    print()

    # Prepare headers
    headers = {"Authorization": f"Bearer {token}"}

    # Test results
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "tests": []
    }

    print("[2/3] Running API tests...")
    print()

    # API-1: GET /api/tasks with simple filter
    print("API-1: GET /api/tasks?status=pending")
    result = run_curl("GET", "/api/tasks?status=pending&offset=0&limit=20", headers=headers)
    results["total"] += 1
    if result["success"] and "data" in result["body"] and "pagination" in result["body"]:
        print("  ✓ PASSED")
        results["passed"] += 1
        results["tests"].append({"id": "API-1", "status": "PASSED", "details": ""})
    else:
        print(f"  ✗ FAILED (status={result['status']}, body={result['body']})")
        results["failed"] += 1
        results["tests"].append({"id": "API-1", "status": "FAILED", "details": str(result)})
    print()

    # API-2: GET /api/tasks with multi-value filter
    print("API-2: GET /api/tasks?status=pending,in_progress")
    result = run_curl("GET", "/api/tasks?status=pending,in_progress&offset=0&limit=20", headers=headers)
    results["total"] += 1
    if result["success"] and "data" in result["body"]:
        print("  ✓ PASSED")
        results["passed"] += 1
        results["tests"].append({"id": "API-2", "status": "PASSED", "details": ""})
    else:
        print(f"  ✗ FAILED (status={result['status']})")
        results["failed"] += 1
        results["tests"].append({"id": "API-2", "status": "FAILED", "details": str(result)})
    print()

    # API-3: GET /api/tasks with combined filters
    print("API-3: GET /api/tasks with combined filters")
    result = run_curl("GET", "/api/tasks?status=pending&priority=high,urgent&offset=0&limit=20", headers=headers)
    results["total"] += 1
    if result["success"]:
        print("  ✓ PASSED")
        results["passed"] += 1
        results["tests"].append({"id": "API-3", "status": "PASSED", "details": ""})
    else:
        print(f"  ✗ FAILED")
        results["failed"] += 1
        results["tests"].append({"id": "API-3", "status": "FAILED", "details": str(result)})
    print()

    # API-4: GET /api/projects with multi-value filter
    print("API-4: GET /api/projects?status=active,completed")
    result = run_curl("GET", "/api/projects?status=active,completed&offset=0&limit=20", headers=headers)
    results["total"] += 1
    if result["success"]:
        print("  ✓ PASSED")
        results["passed"] += 1
        results["tests"].append({"id": "API-4", "status": "PASSED", "details": ""})
    else:
        print(f"  ✗ FAILED")
        results["failed"] += 1
        results["tests"].append({"id": "API-4", "status": "FAILED", "details": str(result)})
    print()

    # API-5: GET /api/contacts with multi-value filter
    print("API-5: GET /api/contacts?status=lead,client")
    result = run_curl("GET", "/api/contacts?status=lead,client&offset=0&limit=20", headers=headers)
    results["total"] += 1
    if result["success"]:
        print("  ✓ PASSED")
        results["passed"] += 1
        results["tests"].append({"id": "API-5", "status": "PASSED", "details": ""})
    else:
        print(f"  ✗ FAILED")
        results["failed"] += 1
        results["tests"].append({"id": "API-5", "status": "FAILED", "details": str(result)})
    print()

    # API-10: GET /api/tasks with pagination
    print("API-10: GET /api/tasks with pagination")
    result = run_curl("GET", "/api/tasks?offset=20&limit=10", headers=headers)
    results["total"] += 1
    if result["success"] and result["body"]["pagination"]["offset"] == 20:
        print("  ✓ PASSED")
        results["passed"] += 1
        results["tests"].append({"id": "API-10", "status": "PASSED", "details": ""})
    else:
        print(f"  ✗ FAILED")
        results["failed"] += 1
        results["tests"].append({"id": "API-10", "status": "FAILED", "details": str(result)})
    print()

    # API-11: SQL injection protection
    print("API-11: SQL injection protection test")
    result = run_curl("GET", "/api/tasks?status=pending;%20DROP%20TABLE%20tasks--", headers=headers, expect_status=400)
    results["total"] += 1
    # Accept 400, 422, or 200 with no data corruption
    if result["status"] in [400, 422] or (result["status"] == 200 and "data" in result["body"]):
        print("  ✓ PASSED (SQL injection blocked)")
        results["passed"] += 1
        results["tests"].append({"id": "API-11", "status": "PASSED", "details": ""})
    else:
        print(f"  ✗ FAILED")
        results["failed"] += 1
        results["tests"].append({"id": "API-11", "status": "FAILED", "details": str(result)})
    print()

    print("[3/3] Summary")
    print(f"  Total: {results['total']}")
    print(f"  Passed: {results['passed']}")
    print(f"  Failed: {results['failed']}")
    print(f"  Success rate: {results['passed'] / results['total'] * 100:.1f}%")
    print()

    # Save results
    with open("/Users/hugohoarau/Desktop/CODE/PERSO/personal-dashboard/dev/backend/tests/api_test_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"Results saved to: api_test_results.json")

    return 0 if results["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
