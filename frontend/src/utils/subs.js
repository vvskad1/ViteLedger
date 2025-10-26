const BASE = "http://localhost:8000";

export async function getMySubscription() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE}/subscriptions/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch subscription");
  }
  
  return response.json();
}

export async function createSubscription(plan, period) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE}/subscriptions/create`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ plan, period }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create subscription");
  }
  
  return response.json();
}

export async function openPortal() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE}/subscriptions/portal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error("Failed to open portal");
  }
  
  return response.json();
}

export async function cancelSubscription() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE}/subscriptions/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to cancel subscription");
  }
  
  return response.json();
}

export async function mockActivate(plan, period) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE}/subscriptions/mock/activate`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ plan, period }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to activate subscription");
  }
  
  return response.json();
}
