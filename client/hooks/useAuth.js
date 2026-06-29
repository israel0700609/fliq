import React, { createContext, useContext, useEffect } from "react";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const AuthContext = createContext();
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const {
    user,
    token,
    login: storeLogin,
    logout: storeLogout,
    loadUser,
    loading,
  } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      if (!SERVER_URL) {
        return {
          success: false,
          message: "Missing EXPO_PUBLIC_SERVER_URL in client/.env",
        };
      }
      const res = await axios.post(`${SERVER_URL}/api/auth/login`, {
        email,
        password,
      });

      const userData = {
        id: res.data.id,
        firstname: res.data.firstname,
        lastname: res.data.lastname,
        email: res.data.email,
        phone: res.data.phone,
      };
      const userToken = res.data.token;

      await storeLogin(userData, userToken);

      return { success: true };
    } catch (error) {
      const isNetworkError = !error.response;
      return {
        success: false,
        message: isNetworkError
          ? "Cannot reach server. Check EXPO_PUBLIC_SERVER_URL and backend status."
          : error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (
    firstname,
    lastname,
    email,
    password,
    phone,
    birthday,
  ) => {
    try {
      if (!SERVER_URL) {
        return {
          success: false,
          message: "Missing EXPO_PUBLIC_SERVER_URL in client/.env",
        };
      }
      const res = await axios.post(`${SERVER_URL}/api/auth/register`, {
        firstname,
        lastname,
        email,
        password,
        phone,
        birthday,
      });

      const userData = {
        id: res.data.id,
        firstname: res.data.firstname || res.data.first_name || firstname || "",
        lastname: res.data.lastname || res.data.last_name || lastname || "",
        email: res.data.email,
      };

      const userToken = res.data.token;

      await storeLogin(userData, userToken);

      return { success: true };
    } catch (error) {
      const isNetworkError = !error.response;
      return {
        success: false,
        message: isNetworkError
          ? "Cannot reach server. Check EXPO_PUBLIC_SERVER_URL and backend status."
          : error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = async () => {
    await storeLogout();
  };

  const updateUser = async (updateData) => {
    try {
      if (!token) return { success: false, message: "Not authenticated" };

      const payload = {
        first_name: updateData.firstname,
        last_name: updateData.lastname,
        phone: updateData.phone,
      };

      const res = await axios.put(`${SERVER_URL}/api/user/update`, payload);

      const updatedUser = {
        ...user,
        firstname: res.data.user.first_name,
        lastname: res.data.user.last_name,
        phone: res.data.user.phone,
      };

      await storeLogin(updatedUser, token);

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("updateUser error:", error.message);
      const isNetworkError = !error.response;
      return {
        success: false,
        message: isNetworkError
          ? "Cannot reach server. Check EXPO_PUBLIC_SERVER_URL and backend status."
          : error.response?.data?.message || "Update failed",
      };
    }
  };

  const deleteUser = async () => {
    try {
      if (!token) return { success: false, message: "Not authenticated" };

      await axios.delete(`${SERVER_URL}/api/user`);

      await storeLogout();

      return { success: true };
    } catch (error) {
      console.error("deleteUser error:", error.message);
      const isNetworkError = !error.response;
      return {
        success: false,
        message: isNetworkError
          ? "Cannot reach server. Check EXPO_PUBLIC_SERVER_URL and backend status."
          : error.response?.data?.message || "Delete user failed",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        deleteUser,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };
