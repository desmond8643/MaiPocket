import { queryClient } from "@/context/GameQueryProvider";
import { LeaderboardEntry, QuizQuestion } from "@/types/game";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Change this to your actual backend URL
const BASE_URL = "https://maipocket-backend.vercel.app";
// const BASE_URL = "http://localhost:3001"
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers["x-auth-token"] = token;
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
        `/charts?type=${type}&value=${encodeURIComponent(
          value
        )}&sortBy=level&order=desc`
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

  // Create a post for a chart
  createPost: async (postData: {
    content: string;
    tags: string[];
    chartId: string | object;
    chartType: string | object;
    chartDifficulty: string | object;
    anonymous: boolean;
  }) => {
    try {
      // Format the data properly
      const formattedData = {
        content: postData.content,
        tags: postData.tags,
        chartId:
          typeof postData.chartId === "string"
            ? postData.chartId
            : String(postData.chartId),
        chartType:
          typeof postData.chartType === "string"
            ? postData.chartType
            : String(postData.chartType),
        chartDifficulty:
          typeof postData.chartDifficulty === "string"
            ? postData.chartDifficulty
            : String(postData.chartDifficulty),
        anonymous: postData.anonymous,
      };

      const response = await apiClient.post("/posts", formattedData);
      return response.data;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },

  // Get posts for a chart
  getPostsForChart: async (chartId: string) => {
    try {
      const response = await apiClient.get(`/posts/chart/${chartId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching posts for chart:", error);
      throw error;
    }
  },

  // Like a post
  likePost: async (postId: string) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error("Error liking post:", error);
      throw error;
    }
  },

  deletePost: async (postId: string) => {
    try {
      const response = await apiClient.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },

  getPostsByChart: async (
    chartId: string,
    chartType: string,
    difficulty: string
  ) => {
    try {
      const response = await axios.get(`${BASE_URL}/posts/chart/${chartId}`, {
        params: { chartType, difficulty },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error getting posts by chart:", error);
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
      const response = await apiClient.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Verify email
  verifyEmail: async (verificationData: { email: string; code: string }) => {
    try {
      const response = await apiClient.post("/auth/verify", verificationData);
      return response.data;
    } catch (error) {
      console.error("Verification error:", error);
      throw error;
    }
  },

  // Resend verification code
  resendVerification: async (email: string) => {
    try {
      const response = await apiClient.post("/auth/resend-verification", {
        email,
      });
      return response.data;
    } catch (error) {
      console.error("Resend verification error:", error);
      throw error;
    }
  },

  // Login user
  login: async (credentials: { usernameOrEmail: string; password: string }) => {
    try {
      const response = await apiClient.post("/auth/login", credentials);
      // Save token to storage
      if (response.data.token) {
        await AsyncStorage.setItem("authToken", response.data.token);
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.data.user)
        );
      }
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");

      queryClient.resetQueries({ queryKey: ["threeLifeDayPassStatus"] });

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/auth/me");
      return response.data;
    } catch (error) {
      console.error("Get user error:", error);
      throw error;
    }
  },

  // Check if user is logged in
  isLoggedIn: async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("userData");
      return !!token && !!userData;
    } catch (error) {
      console.error("Check login status error:", error);
      return false;
    }
  },

  // Request password reset
  forgotPassword: async (email: string) => {
    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  },

  // Verify reset code
  verifyResetCode: async (verificationData: {
    email: string;
    code: string;
  }) => {
    try {
      const response = await apiClient.post(
        "/auth/verify-reset-code",
        verificationData
      );
      return response.data;
    } catch (error) {
      console.error("Reset code verification error:", error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (resetData: {
    email: string;
    code: string;
    newPassword: string;
  }) => {
    try {
      const response = await apiClient.post("/auth/reset-password", resetData);
      return response.data;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData: {
    username?: string;
    displayName?: string;
  }) => {
    try {
      const response = await apiClient.put("/auth/profile", profileData);
      return response.data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      const response = await apiClient.post(
        "/auth/change-password",
        passwordData
      );
      return response.data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  },
};

export const NotificationAPI = {
  // Get user notifications with pagination
  getNotifications: async (limit = 10, skip = 0) => {
    try {
      const response = await apiClient.get(
        `/notifications?limit=${limit}&skip=${skip}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Get unread notification count
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get("/notifications/count");
      return response.data.count;
    } catch (error) {
      console.error("Error fetching notification count:", error);
      return 0;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    try {
      const response = await apiClient.post("/notifications/mark-read", {
        notificationId,
      });
      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await apiClient.post("/notifications/mark-read", {
        markAll: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  // Archive notification
  archiveNotification: async (notificationId: string) => {
    try {
      const response = await apiClient.post("/notifications/archive", {
        notificationId,
      });
      return response.data;
    } catch (error) {
      console.error("Error archiving notification:", error);
      throw error;
    }
  },
};

export const getQuizQuestions = async (
  mode: string
): Promise<QuizQuestion[]> => {
  const response = await apiClient.get(`/game/questions?mode=${mode}`);
  return response.data;
};

// Update the function signature
export const submitScore = async (
  mode: string,
  score: number,
  accumulatedStreak: number, // This is for high score comparison
  currentStreak: number // This is for next game (0 if lost)
) => {
  const response = await apiClient.post("/game/score", {
    mode,
    score,
    accumulatedStreak, // Send both values
    currentStreak,
  });

  // Return the full response data which includes highScore
  return response.data;
};

export const getHighScores = async () => {
  const response = await apiClient.get(`/game/scores`);
  return response.data;
};

export const getLeaderboard = async (
  mode: string
): Promise<LeaderboardEntry[]> => {
  const response = await apiClient.get(`/game/leaderboard/${mode}`);
  return response.data;
};

export const getUserStreak = async (
  mode: string
): Promise<{ currentStreak: number; highScore: number }> => {
  const response = await apiClient.get(`/game/streak/${mode}`);
  return response.data;
};

export const getCrystalStatus = async () => {
  try {
    const response = await apiClient.get("/game/crystal-status");
    return response.data;
  } catch (error) {
    console.error("Error fetching crystal status:", error);
    return null;
  }
};

export const getCasualQuizQuestions = async (
  mode: string,
  categoryType?: string,
  subCategory?: string
): Promise<QuizQuestion[]> => {
  console.log(mode, categoryType, subCategory);
  const params = new URLSearchParams();
  params.append("mode", mode);

  if (categoryType && categoryType !== "all") {
    params.append("categoryType", categoryType);

    if (subCategory) {
      params.append("subCategory", subCategory);
    }
  }

  const response = await apiClient.get(
    `/game/casual-questions?${params.toString()}`
  );
  return response.data;
};

export const submitCasualScore = async (score: number) => {
  const response = await apiClient.post("/game/casual-crystals", {
    score,
  });
  return response.data;
};

export const purchaseThreeLifeDayPass = async () => {
  try {
    const response = await apiClient.post("/shop/purchase/threelifedaypass");
    return response.data;
  } catch (error) {
    console.error("Error purchasing day pass:", error);
    throw error;
  }
};

export const getThreeLifeDayPassStatus = async () => {
  try {
    const response = await apiClient.get("/shop/threelifedaypass/status");
    return response.data;
  } catch (error) {
    console.error("Error fetching day pass status:", error);
    throw error;
  }
};
