const API_BASE = "http://localhost:5000/api";

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function sendOtp(phone: string) {
  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

export async function register(data: any) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": token } : {})
  };
};

export async function getProfile() {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateProfile(data: { full_name?: string, dob?: string, gender?: string, email?: string, phone?: string, location?: string }) {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

export async function getSignals(junctionId: number) {
  const res = await fetch(`${API_BASE}/signals/${junctionId}`);
  if (!res.ok) throw new Error("Failed to fetch signals");
  return res.json();
}

export async function updateSignal(
  junctionId: number,
  direction: "l1" | "l2" | "l3" | "l4",
  state: "red" | "yellow" | "green"
) {
  const res = await fetch(`${API_BASE}/signals/${junctionId}/${direction}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ state }),
  });

  if (!res.ok) throw new Error("Failed to update signal");
  return res.json();
}

export async function updateSignalMode(
  junctionId: number,
  mode: "auto" | "manual"
) {
  const res = await fetch(`${API_BASE}/signals/${junctionId}/mode`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode }),
  });

  if (!res.ok) throw new Error("Failed to update signal mode");
  return res.json();
}

export async function updateSignalTiming(
  junctionId: number,
  greenTime: number
) {
  const res = await fetch(`${API_BASE}/signals/${junctionId}/timing`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ greenTime }),
  });

  if (!res.ok) throw new Error("Failed to update signal timing");
  return res.json();
}

export async function getVehicleTypes() {
  const res = await fetch(`${API_BASE}/analytics/vehicle-types`);
  if (!res.ok) throw new Error("Failed to fetch vehicle types");
  return res.json();
}

export async function getHourlyCount() {
  const res = await fetch(`${API_BASE}/analytics/hourly-count`);
  if (!res.ok) throw new Error("Failed to fetch hourly count");
  return res.json();
}

export async function getLaneDensity() {
  const res = await fetch(`${API_BASE}/analytics/lane-density`);
  if (!res.ok) throw new Error("Failed to fetch lane density");
  return res.json();
}

export async function getInsights() {
  const res = await fetch(`${API_BASE}/analytics/insights`);
  if (!res.ok) throw new Error("Failed to fetch insights");
  return res.json();
}

export async function getAlerts() {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function markAlertRead(id: number) {
  const res = await fetch(`${API_BASE}/alerts/${id}/read`, {
    method: "PUT",
  });

  if (!res.ok) throw new Error("Failed to mark alert read");
  return res.json();
}

export async function markAllAlertsRead() {
  const res = await fetch(`${API_BASE}/alerts/mark-all-read`, {
    method: "PUT",
  });

  if (!res.ok) throw new Error("Failed to mark all alerts read");
  return res.json();
}

export async function getCameras() {
  const res = await fetch(`${API_BASE}/cameras`);
  if (!res.ok) throw new Error("Failed to fetch cameras");
  return res.json();
}

export async function getCameraById(cameraId: number) {
  const res = await fetch(`${API_BASE}/cameras/${cameraId}`);
  if (!res.ok) throw new Error("Failed to fetch camera");
  return res.json();
}

export async function updateCameraConfig(cameraId: number, laneConfig: any) {
  const res = await fetch(`${API_BASE}/cameras/${cameraId}/config`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ lane_config: laneConfig }),
  });
  if (!res.ok) throw new Error("Failed to update config");
  return res.json();
}

export async function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append("video", file);

  const res = await fetch(`${API_BASE}/video/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Video upload failed");
  return res.json();
}

export async function processVideo(fileName: string) {
  const res = await fetch(`${API_BASE}/video/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName }),
  });
  if (!res.ok) throw new Error("Video processing failed");
  return res.json();
}

export async function checkJobStatus(jobId: string) {
  const res = await fetch(`${API_BASE}/video/status/${jobId}`);
  if (!res.ok) throw new Error("Failed to check job status");
  return res.json();
}

export async function getReports(period: "daily" | "weekly" | "monthly") {
  const res = await fetch(`${API_BASE}/reports/${period}`);
  if (!res.ok) throw new Error(`Failed to fetch ${period} reports`);
  return res.json();
}

export async function triggerEmergency(laneId: string, action: "trigger" | "clear") {
  const res = await fetch(`${API_BASE}/signals/emergency`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ laneId, action }),
  });
  if (!res.ok) throw new Error("Failed to trigger emergency override");
  return res.json();
}