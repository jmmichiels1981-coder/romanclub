// Native fetch used

// If node < 18, we might need to handle fetch differently. Backend uses native fetch or axios? 
// Frontend uses native fetch. Node 18+ has native fetch. User environment is Windows, likely recent Node.
// If not, I'll use a simple http request wrapper.

const API_URL = "http://localhost:3000";
const EMAIL = "jmmichiels1981@gmail.com";
const INITIAL_PIN = "123456";
const NEW_PIN = "654321";

async function runTest() {
    try {
        console.log("1. Login with initial PIN...");
        let res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, pin: INITIAL_PIN })
        });
        let data = await res.json();

        if (!data.success) {
            console.error("Login failed:", data);
            return;
        }
        const token = data.token;
        console.log("✅ Login successful. Token received.");

        console.log("\n2. Try Change PIN with WRONG current PIN...");
        res = await fetch(`${API_URL}/me/change-pin`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPin: "000000", newPin: NEW_PIN })
        });
        data = await res.json();
        if (res.status === 400) {
            console.log("✅ Correctly rejected wrong PIN:", data.error);
        } else {
            console.error("❌ Failed: Should have rejected wrong PIN", data);
        }

        console.log("\n3. Try Change PIN with INVALID new PIN (too short)...");
        res = await fetch(`${API_URL}/me/change-pin`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPin: INITIAL_PIN, newPin: "123" })
        });
        data = await res.json();
        if (res.status === 400) {
            console.log("✅ Correctly rejected short PIN:", data.error);
        } else {
            console.error("❌ Failed: Should have rejected short PIN", data);
        }

        console.log("\n4. Change PIN to NEW_PIN (valid)...");
        res = await fetch(`${API_URL}/me/change-pin`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPin: INITIAL_PIN, newPin: NEW_PIN })
        });
        data = await res.json();
        if (data.success) {
            console.log("✅ PIN Changed Successfully.");
        } else {
            console.error("❌ Failed to change PIN", data);
            return;
        }

        console.log("\n5. Login with NEW PIN...");
        res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, pin: NEW_PIN })
        });
        data = await res.json();
        if (data.success) {
            console.log("✅ Login with new PIN successful.");
        } else {
            console.error("❌ Login with new PIN failed:", data);
        }

        console.log("\n6. Revert PIN back to initial...");
        res = await fetch(`${API_URL}/me/change-pin`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Token from first login is still valid
            },
            body: JSON.stringify({ currentPin: NEW_PIN, newPin: INITIAL_PIN })
        });
        data = await res.json();
        if (data.success) {
            console.log("✅ Reverted PIN successfully.");
        } else {
            console.error("❌ Failed to revert PIN", data);
        }

    } catch (e) {
        console.error("Test Error:", e);
    }
}

runTest();
