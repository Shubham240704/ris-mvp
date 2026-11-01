
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Keep the JWT in application memory.
let authToken = null;

export function setAuthToken(token) {
    authToken = token;

    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common.Authorization;
    }
}

export default api;
