const API_BASE = "http://localhost:5000/api";

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
  direction: "north" | "south" | "east" | "west",
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