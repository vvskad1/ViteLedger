// API utility with automatic token refresh handling

export const handleApiError = (error, navigate) => {
  if (error.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    if (navigate) {
      navigate('/login', { 
        state: { message: 'Session expired. Please login again.' } 
      });
    } else {
      window.location.href = '/login';
    }
    return true;
  }
  return false;
};

export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = '/login';
    throw new Error('Unauthorized - Please login again');
  }

  return response;
};

// RAG-enabled API calls for Mindfulness
export async function mindAdvice(message, useWeb = true) {
  const res = await apiRequest("http://localhost:8000/mind/advice", {
    method: "POST",
    body: JSON.stringify({ message, useWeb }),
  });
  return res.json();
}

export async function mindSearch(query) {
  const res = await apiRequest("http://localhost:8000/mind/search", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  return res.json();
}

// RAG-enabled API calls for Fitness
export async function fitnessAdvice(message, useWeb = true) {
  const res = await apiRequest("http://localhost:8000/fitness/advice", {
    method: "POST",
    body: JSON.stringify({ message, useWeb }),
  });
  return res.json();
}

export async function fitnessSearch(query) {
  const res = await apiRequest("http://localhost:8000/fitness/search", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  return res.json();
}

// Nutrition Meal Plan API
export async function generateMealPlan(expectations) {
  const formData = new FormData();
  formData.append('expectations', expectations);
  
  const token = localStorage.getItem('token');
  const res = await fetch("http://localhost:8000/nutrition/meal-plan/generate", {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  return res.json();
}

export async function getActiveMealPlan() {
  const res = await apiRequest("http://localhost:8000/nutrition/meal-plan/active", {
    method: "GET"
  });
  return res.json();
}

export async function getMealPlanHistory() {
  const res = await apiRequest("http://localhost:8000/nutrition/meal-plan/history", {
    method: "GET"
  });
  return res.json();
}
