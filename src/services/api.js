const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get stored token
const getToken = () => localStorage.getItem('token');

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// File upload helper (no Content-Type header, browser sets it for FormData)
const uploadRequest = async (endpoint, formData) => {
  const token = getToken();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Upload failed');
  }

  return data;
};

// Auth API
export const authAPI = {
  register: async (name, email, password) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.data?.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  },

  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.data?.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },

  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (currentPassword, newPassword) => {
    return apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// User Profile API (separate from usersAPI for clarity)
export const userAPI = {
  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  uploadAvatar: async (formData) => {
    return uploadRequest('/auth/avatar', formData);
  },

  changePassword: async (currentPassword, newPassword) => {
    return apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Users API
export const usersAPI = {
  search: async (query) => {
    return apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
  },

  getById: async (userId) => {
    return apiRequest(`/users/${userId}`);
  },

  getContacts: async () => {
    return apiRequest('/users/contacts');
  },

  addContact: async (userId) => {
    return apiRequest(`/users/contacts/${userId}`, { method: 'POST' });
  },

  removeContact: async (userId) => {
    return apiRequest(`/users/contacts/${userId}`, { method: 'DELETE' });
  },

  toggleBlock: async (userId) => {
    return apiRequest(`/users/contacts/${userId}/block`, { method: 'PUT' });
  },

  toggleFavorite: async (userId) => {
    return apiRequest(`/users/contacts/${userId}/favorite`, { method: 'PUT' });
  },

  updateSettings: async (settings) => {
    return apiRequest('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  updateStatus: async (status) => {
    return apiRequest('/users/status', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Conversations API
export const conversationsAPI = {
  getAll: async (type = null, archived = false) => {
    let url = '/conversations?';
    if (type) url += `type=${type}&`;
    if (archived) url += 'archived=true';
    return apiRequest(url);
  },

  getById: async (conversationId) => {
    return apiRequest(`/conversations/${conversationId}`);
  },

  createPrivate: async (userId) => {
    return apiRequest('/conversations/private', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  createGroup: async (name, participants, description = '', avatar = '') => {
    return apiRequest('/conversations/group', {
      method: 'POST',
      body: JSON.stringify({ name, participants, description, avatar }),
    });
  },

  updateGroup: async (conversationId, updates) => {
    return apiRequest(`/conversations/${conversationId}/group`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  addParticipants: async (conversationId, userIds) => {
    return apiRequest(`/conversations/${conversationId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  },

  removeParticipant: async (conversationId, userId) => {
    return apiRequest(`/conversations/${conversationId}/participants/${userId}`, {
      method: 'DELETE',
    });
  },

  makeAdmin: async (conversationId, userId) => {
    return apiRequest(`/conversations/${conversationId}/admins/${userId}`, {
      method: 'PUT',
    });
  },

  removeAdmin: async (conversationId, userId) => {
    return apiRequest(`/conversations/${conversationId}/admins/${userId}`, {
      method: 'DELETE',
    });
  },

  togglePin: async (conversationId) => {
    return apiRequest(`/conversations/${conversationId}/pin`, { method: 'PUT' });
  },

  toggleMute: async (conversationId, until = null) => {
    return apiRequest(`/conversations/${conversationId}/mute`, {
      method: 'PUT',
      body: JSON.stringify({ until }),
    });
  },

  toggleArchive: async (conversationId) => {
    return apiRequest(`/conversations/${conversationId}/archive`, { method: 'PUT' });
  },

  delete: async (conversationId) => {
    return apiRequest(`/conversations/${conversationId}`, { method: 'DELETE' });
  },

  clearHistory: async (conversationId) => {
    return apiRequest(`/conversations/${conversationId}/messages`, { method: 'DELETE' });
  },
};

// Messages API
export const messagesAPI = {
  getMessages: async (conversationId, page = 1, limit = 50) => {
    return apiRequest(`/messages/${conversationId}?page=${page}&limit=${limit}`);
  },

  send: async (conversationId, content, type = 'text', replyTo = null, attachments = []) => {
    return apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content, type, replyTo, attachments }),
    });
  },

  edit: async (messageId, content) => {
    return apiRequest(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  delete: async (messageId, forEveryone = false) => {
    return apiRequest(`/messages/${messageId}?forEveryone=${forEveryone}`, {
      method: 'DELETE',
    });
  },

  markAsRead: async (conversationId, messageIds = []) => {
    return apiRequest(`/messages/${conversationId}/read`, {
      method: 'PUT',
      body: JSON.stringify({ messageIds }),
    });
  },

  addReaction: async (messageId, emoji) => {
    return apiRequest(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },

  removeReaction: async (messageId) => {
    return apiRequest(`/messages/${messageId}/reactions`, { method: 'DELETE' });
  },

  forward: async (messageId, conversationIds) => {
    return apiRequest(`/messages/${messageId}/forward`, {
      method: 'POST',
      body: JSON.stringify({ conversationIds }),
    });
  },

  togglePin: async (messageId) => {
    return apiRequest(`/messages/${messageId}/pin`, { method: 'PUT' });
  },

  search: async (conversationId, query) => {
    return apiRequest(`/messages/${conversationId}/search?q=${encodeURIComponent(query)}`);
  },

  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getToken();
    const response = await fetch(`${API_URL}/messages/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default {
  authAPI,
  usersAPI,
  conversationsAPI,
  messagesAPI,
  isAuthenticated,
  getCurrentUser,
};
