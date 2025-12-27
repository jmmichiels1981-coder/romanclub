export function getDeviceId() {
    const STORAGE_KEY = 'romanclub_device_id';
    let deviceId = localStorage.getItem(STORAGE_KEY);

    if (!deviceId) {
        // Generate a simple UUID-like string
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem(STORAGE_KEY, deviceId);
    }

    return deviceId;
}
