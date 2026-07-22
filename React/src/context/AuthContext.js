import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Auto-login verify session if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        localStorage.setItem('token', token);
        
        // If user state is already present (e.g. from fresh login/signup), skip fetch
        if (user) {
          setLoading(false);
          return;
        }

        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (res.ok) {
            setUser(data);
          } else {
            console.warn('Session verification failed:', data.message || 'Unknown error');
            // Token expired/invalid
            setToken('');
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Session load error:', err);
          setToken('');
          localStorage.removeItem('token');
        }
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
      setLoading(false);
    };

    loadUser();
  }, [token, user]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Login failed.' };
    }
  };

  const signup = async (name, email, password) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Registration failed.' };
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
        }
      } catch (err) {
        console.error('Refresh user error:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
