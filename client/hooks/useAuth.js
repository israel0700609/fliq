import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');
        
        if (savedToken) {
          setToken(savedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        }
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error("Failed to load auth data", e);
      } finally {
        setLoading(false);
      }
    };
    loadStoredData();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post("http://192.168.1.43:5000/api/auth/login", { email, password });

      const userData = {
        id: res.data.id,
        firstname: res.data.firstname,
        lastname: res.data.lastname,
        email: res.data.email,
      };

      const userToken = res.data.token;

      setUser(userData);
      setToken(userToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;

      await AsyncStorage.setItem('token', userToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (firstname, lastname, email, password, phone, birthday) => {
    try {
      const res = await axios.post("http://192.168.1.43:5000/api/auth/register", {
        firstname, lastname, email, password, phone, birthday
      });

      const userData = {
        id: res.data.id,
        firstname: res.data.firstname,
        lastname: res.data.lastname,
        email: res.data.email,
      };

      const userToken = res.data.token;

      setUser(userData);
      setToken(userToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;

      await AsyncStorage.setItem('token', userToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Register failed' 
      };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      loading,
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth, AuthProvider };