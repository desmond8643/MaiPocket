import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your actual backend URL
const BASE_URL = "https://maipocket-backend.vercel.app";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Define API functions
export const ChartAPI = {
  // Get all charts
  getAllCharts: async () => {
    try {
      const response = await apiClient.get("/charts");
      return response.data;
    } catch (error) {
      console.error("Error fetching charts:", error);
      throw error;
    }
  },

  // Get charts by category (genre, version, etc.)
  getChartsByCategory: async (type: string, value: string) => {
    console.log(value);
    try {
      const response = await apiClient.get(
        `/charts?type=${type}&value=${encodeURIComponent(value)}&sortBy=level&order=desc`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching charts by ${type}:`, error);
      throw error;
    }
  },

  // Search charts
  searchCharts: async (query: string) => {
    try {
      const response = await apiClient.get(
        `/charts/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching charts:", error);
      throw error;
    }
  },

  // Get a single chart by ID
  getChartById: async (id: string) => {
    try {
      const response = await apiClient.get(`/charts/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chart details:", error);
      throw error;
    }
  },
};

export const AuthAPI = {
  // Register a new user
  register: async (userData: {
    username: string;
    email: string;
    displayName: string;
    password: string;
  }) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  // Verify email
  verifyEmail: async (verificationData: { email: string; code: string }) => {
    try {
      const response = await apiClient.post('/auth/verify', verificationData);
      return response.data;
    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  },
  
  // Resend verification code
  resendVerification: async (email: string) => {
    try {
      const response = await apiClient.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  },
  
  // Login user
  login: async (credentials: { usernameOrEmail: string; password: string }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      // Save token to storage
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },
  
  // Check if user is logged in
  isLoggedIn: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      return !!token && !!userData;
    } catch (error) {
      console.error('Check login status error:', error);
      return false;
    }
  },

  // Request password reset
  forgotPassword: async (email: string) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  // Verify reset code
  verifyResetCode: async (verificationData: { email: string; code: string }) => {
    try {
      const response = await apiClient.post('/auth/verify-reset-code', verificationData);
      return response.data;
    } catch (error) {
      console.error('Reset code verification error:', error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (resetData: { email: string; code: string; newPassword: string }) => {
    try {
      const response = await apiClient.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData: { username?: string; displayName?: string }) => {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await apiClient.post('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
};
