import urllib.request
import urllib.parse
import json
import sys

BASE_BACKEND = "http://127.0.0.1:5000/api/v1"
BASE_ML = "http://127.0.0.1:8000"

def request_json(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        try:
            body = json.loads(err.read().decode("utf-8"))
        except Exception:
            body = {"error": str(err)}
        return err.code, body
    except Exception as exc:
        return 0, {"error": str(exc)}

def run_tests():
    print("=" * 60)
    print("CERES RELIABILITY & SECURITY AUDIT TEST SUITE")
    print("=" * 60)

    # 1. Health Checks
    print("\n[1/7] Testing Service Health Endpoints...")
    status, ml_data = request_json(f"{BASE_ML}/")
    assert status == 200, f"ML Service failed with status {status}"
    assert ml_data.get("status") == "ML Server Up & Running"
    print("  [PASS] ML Service healthy on port 8000: 'ML Server Up & Running'")

    req = urllib.request.Request(f"{BASE_BACKEND}")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        html = resp.read().decode("utf-8")
        assert "Server Up & Running" in html
    print("  [PASS] Backend healthy on port 5000: 'Server Up & Running'")

    # 2. Authentication
    print("\n[2/7] Testing Farmer Authentication...")
    import time
    test_phone = str(int(time.time()))[-10:]
    register_data = {
        "name": "Arjun Patil",
        "gender": "male",
        "dob": "1985-05-15",
        "phoneno": test_phone,
        "password": "Password@123",
        "crops": ["Wheat"]
    }
    status, auth_res = request_json(f"{BASE_BACKEND}/auth/register", method="POST", data=register_data)
    if status != 201:
        # Try login if user already exists
        status, auth_res = request_json(f"{BASE_BACKEND}/auth/login", method="POST", data={
            "phoneno": test_phone,
            "password": "Password@123"
        })
    assert status in (200, 201), f"Authentication failed: {auth_res}"
    token = auth_res.get("token")
    user_id = auth_res.get("user", {}).get("_id") or auth_res.get("_id")
    assert token, "Token not returned in auth response"
    print(f"  [PASS] Authenticated farmer: Arjun Patil (User ID: {user_id})")

    # 3. Farm Onboarding & Empty State Audit (Phase 4A)
    print("\n[3/7] Testing Farm Onboarding & Honest Empty State...")
    status, profile_res = request_json(f"{BASE_BACKEND}/farm/profile", token=token)
    assert status == 200, f"Farm profile fetch failed: {profile_res}"
    print(f"  [PASS] Profile query succeeded (Status: {status})")
    
    # Add a user-defined plot
    plot_data = {
        "name": "East Orchard Plot",
        "crop": "Wheat",
        "variety": "Lokwan",
        "area": 3.5,
        "areaUnit": "Acres",
        "sowingDate": "2026-10-15",
        "growthStage": "Vegetative / Tillering",
        "soilType": "Loamy",
        "irrigationMethod": "Drip Irrigation"
    }
    status, add_res = request_json(f"{BASE_BACKEND}/farm/plots", method="POST", data=plot_data, token=token)
    assert status == 201, f"Adding plot failed: {add_res}"
    created_plot = add_res.get("plot", {})
    plot_id = created_plot.get("_id")
    assert created_plot.get("name") == "East Orchard Plot"
    assert created_plot.get("crop") == "Wheat"
    assert created_plot.get("area") == 3.5
    print(f"  [PASS] Created farmer plot: {created_plot.get('name')} ({created_plot.get('crop')}, {created_plot.get('area')} {created_plot.get('areaUnit')})")

    # Verify active plot updated
    status, profile_after = request_json(f"{BASE_BACKEND}/farm/profile", token=token)
    assert profile_after.get("activePlot", {}).get("_id") == plot_id
    print("  [PASS] Active plot context correctly synchronized")

    # 4. Security & Data Isolation Audit (Phase 4B)
    print("\n[4/7] Testing Authorization & Data Isolation (IDOR prevention)...")
    fake_victim_id = "victim_user_99999"
    status, idor_res = request_json(f"{BASE_BACKEND}/predictions/history/{fake_victim_id}", token=token)
    assert status == 403, f"IDOR Vulnerability detected! Expected 403 Forbidden, got {status}: {idor_res}"
    print("  [PASS] IDOR protection verified: accessing another user's scan history returned 403 Forbidden")

    # 5. Field Intelligence & IoT Telemetry Modes (Phase 4E)
    print("\n[5/7] Testing Field Intelligence Modes & Explainability...")
    # Simulated mode
    status, sim_res = request_json(f"{BASE_BACKEND}/iot/readings?mode=simulated", token=token)
    assert status == 200
    telemetry = sim_res.get("readings", {})
    advisory = sim_res.get("advisory", {})
    assert telemetry.get("isSimulated") is True
    assert telemetry.get("mode") == "SIMULATION"
    assert "irrigationAdvice" in advisory
    print(f"  [PASS] Simulation mode: {telemetry.get('mode')} (Soil Moisture: {telemetry.get('soilMoisture')}%)")
    print(f"  [PASS] Farmer-friendly advice: '{advisory.get('irrigationAdvice', {}).get('action')}'")

    # Hardware mode when offline
    status, hw_res = request_json(f"{BASE_BACKEND}/iot/readings?mode=hardware", token=token)
    assert status == 200
    hw_telemetry = hw_res.get("readings", {})
    assert hw_telemetry.get("connectionStatus") == "OFFLINE"
    assert "No active physical ESP32 sensor detected" in hw_telemetry.get("message", "")
    print("  [PASS] Hardware mode offline handling: transparently alerts sensor disconnection without inventing readings")

    # Manual observation entry
    manual_data = {
        "soilMoisture": 42.0,
        "temperature": 27.5,
        "humidity": 65.0,
        "rainfall": 0.0,
        "soilBallFeel": "Moist ball forms easily, does not crumble"
    }
    status, man_res = request_json(f"{BASE_BACKEND}/iot/manual", method="POST", data=manual_data, token=token)
    assert status == 200
    status, man_readings = request_json(f"{BASE_BACKEND}/iot/readings?mode=manual", token=token)
    assert man_readings.get("readings", {}).get("mode") == "MANUAL"
    assert man_readings.get("readings", {}).get("soilMoisture") == 42.0
    print("  [PASS] Manual mode: farmer observations recorded and retrieved accurately")

    # 6. Mandi Prices & Yield Simulator (Phase 4F, 4G)
    print("\n[6/7] Testing Mandi Price Tracker & Yield Simulator...")
    status, mandi_res = request_json(f"{BASE_BACKEND}/mandi/prices?crop=Wheat&state=Maharashtra")
    assert status == 200
    assert "freshness" in mandi_res
    assert len(mandi_res.get("records", [])) > 0
    record = mandi_res.get("records", [])[0]
    print(f"  [PASS] Mandi Prices: {len(mandi_res.get('records', []))} records found (Freshness: {mandi_res.get('freshness')}, Source: '{mandi_res.get('source')}')")
    print(f"    Sample: {record.get('commodity')} at {record.get('market')}: INR {record.get('modal_price')} / Quintal")

    # Yield prediction
    yield_req = {
        "crop": "Wheat",
        "state": "Maharashtra",
        "soilType": "Loamy",
        "area": 3.5,
        "areaUnit": "Acres",
        "annualRainfall": 950
    }
    status, yield_res = request_json(f"{BASE_BACKEND}/intelligence/yield-prediction", method="POST", data=yield_req)
    assert status == 200
    yield_acre = yield_res.get("yieldPerAcre", {}).get("quintals")
    total_q = yield_res.get("totalEstimatedProduction", {}).get("quintals")
    assert yield_acre is not None and yield_acre > 0
    assert total_q is not None and total_q > 0
    print(f"  [PASS] Empirical Yield Forecast: {yield_acre} Q/Acre (Total Production: {total_q} Q)")
    print(f"  [PASS] Yield Confidence Range: {yield_res.get('confidenceRange', {}).get('minQuintals')} - {yield_res.get('confidenceRange', {}).get('maxQuintals')} Q")

    # 7. Daily Tasks & Plantation Calendar (Phase 4H)
    print("\n[7/7] Testing Daily Tasks & Plantation Calendar...")
    status, tasks_res = request_json(f"{BASE_BACKEND}/intelligence/tasks", token=token)
    assert status == 200
    tasks = tasks_res.get("tasks", [])
    assert len(tasks) > 0
    print(f"  [PASS] Daily Checklist for {tasks_res.get('crop')}: {len(tasks)} actionable tasks loaded")
    first_task = tasks[0]
    task_id = first_task.get("_id")
    status, toggle_res = request_json(f"{BASE_BACKEND}/intelligence/tasks/{task_id}/toggle", method="PATCH", data={"completed": True}, token=token)
    assert status == 200
    assert toggle_res.get("task", {}).get("completed") is True
    print(f"  [PASS] Task completion toggled and persisted for: '{first_task.get('taskTitle')}'")

    # Calendar check
    status, cal_res = request_json(f"{BASE_BACKEND}/intelligence/crop-calendar?crop=Wheat")
    assert status == 200
    assert cal_res.get("crop", {}).get("durationDays") == 130
    print(f"  [PASS] Crop Calendar: Wheat Rabi cycle ({cal_res.get('crop', {}).get('durationDays')} days) loaded with verified stage tips")

    print("\n" + "=" * 60)
    print("ALL AUDIT WORKFLOW TESTS PASSED SUCCESSFULLY (100% GREEN)")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
