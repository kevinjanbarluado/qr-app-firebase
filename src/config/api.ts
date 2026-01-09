// API configuration
const getApiBaseUrl = (): string => {
    // In development, use HTTPS with the same host as the frontend
    if (import.meta.env.DEV) {
        return `https://${window.location.hostname}:3001`;
    }

    // In production, use HTTPS with the same host as the frontend
    return `https://${window.location.hostname}:3001`;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
    REGISTER: `${API_BASE_URL}/api/users/register`,
    QR_CODE: (userId: string) => `${API_BASE_URL}/api/users/${userId}/qr`,
    SCAN_QR: `${API_BASE_URL}/api/qr/scan`,
    USERS: `${API_BASE_URL}/api/users`,
    HEALTH: `${API_BASE_URL}/api/health`,
} as const;
