import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Share auth data with extension
      await syncAuthWithExtension(token, user);
      
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Share auth data with extension
      await syncAuthWithExtension(token, user);
      
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear auth data from extension
    clearAuthFromExtension();
    
    setUser(null);
  };

  // Sync authentication with extension
  const syncAuthWithExtension = async (token, user) => {
    try {
      if (window.chrome && chrome.storage) {
        await chrome.storage.local.set({
          token: token,
          user: user
        });
        console.log('✅ Auth data synced with extension');
        
        // Also try to sync via runtime message
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'syncAuth',
            token: token,
            user: user
          });
        }
      }
    } catch (error) {
      console.log('Extension not available, auth data not shared');
    }
  };

  // Clear auth from extension
  const clearAuthFromExtension = () => {
    try {
      if (window.chrome && chrome.storage) {
        chrome.storage.local.remove(['token', 'user']);
        console.log('✅ Auth data cleared from extension');
      }
    } catch (error) {
      console.log('Extension not available');
    }
  };

  const updatePreferences = async (preferences) => {
    try {
      const response = await authAPI.updateProfile(preferences);
      const updatedUser = response.data.data.user;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update preferences'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updatePreferences,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 