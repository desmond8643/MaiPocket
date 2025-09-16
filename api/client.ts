import axios from "axios";

// Change this to your actual backend URL
const BASE_URL = "https://maipocket-backend.vercel.app";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
