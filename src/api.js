import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://aiception.com/api/v2.1';

function getAuth() {
  const username = getConfig('username');
  const password = getConfig('password');
  if (!username || !password) {
    throw new Error('Credentials not configured. Run: aiception config set username YOUR_USER and aiception config set password YOUR_PASS');
  }
  return { username, password };
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    if (status === 401 || status === 403) {
      throw new Error('Authentication failed. Check your username/password credentials.');
    } else if (status === 429) {
      throw new Error('Rate limit exceeded. Please wait before retrying.');
    } else if (status === 404) {
      throw new Error('Resource not found.');
    } else {
      const message = data?.error || data?.message || JSON.stringify(data);
      throw new Error(`API Error (${status}): ${message}`);
    }
  } else if (error.request) {
    throw new Error('No response from AIception API. Check your internet connection.');
  } else {
    throw error;
  }
}

async function apiGet(path) {
  const auth = getAuth();
  try {
    const response = await axios.get(`${BASE_URL}${path}`, { auth });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

async function apiPost(path, data = {}) {
  const auth = getAuth();
  try {
    const response = await axios.post(`${BASE_URL}${path}`, data, { auth });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// IMAGES
// ============================================================

export async function analyzeImage(imageUrl) {
  return await apiPost('/image_understanding', { image_url: imageUrl });
}

export async function classifyImage(imageUrl) {
  return await apiPost('/classify', { image_url: imageUrl });
}

export async function detectObjects(imageUrl) {
  return await apiPost('/detect_objects', { image_url: imageUrl });
}

// ============================================================
// NUDITY DETECTION
// ============================================================

export async function detectNudity(imageUrl) {
  return await apiPost('/detect_nudity', { image_url: imageUrl });
}

// ============================================================
// TASKS
// ============================================================

export async function getTask(taskId) {
  return await apiGet(`/task/${taskId}`);
}

export async function listTasks() {
  return await apiGet('/tasks');
}
