
import apiClient from './api-client';
import { LoginResponse, ApiLoginResponse, RegisterResponse, User, UserRole } from '../types/api';

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// Mock users for development
const mockUsers = [
  { id: 1, username: 'driver@example.com', password: 'password', email: 'driver@example.com', role: 'DRIVER' as UserRole },
  { id: 2, username: 'manager@example.com', password: 'password', email: 'manager@example.com', role: 'STATION_MANAGER' as UserRole },
  { id: 3, username: 'admin@example.com', password: 'password', email: 'admin@example.com', role: 'ADMIN' as UserRole }
];

const AuthService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      // Try to connect to the real API first
      console.log('Attempting to login with backend API at:', apiClient.defaults.baseURL);
      const response = await apiClient.post<ApiLoginResponse>('/auth/login', credentials);
      
      console.log('API Login response:', response.data);
      
      // Create a standard LoginResponse format regardless of the API structure
      // API directly returns { token, username, role } at root level
      const loginResponse: LoginResponse = {
        token: response.data.token,
        user: {
          id: response.data.user?.id || 0,
          username: response.data.username,
          email: response.data.user?.email || credentials.username,
          role: response.data.role
        }
      };
      
      // Store the token and user info in localStorage
      localStorage.setItem('token', loginResponse.token);
      localStorage.setItem('user', JSON.stringify(loginResponse.user));
      
      return loginResponse;
    } catch (error) {
      console.error('Login API error:', error);
      
      // If the API fails and we're in development, fall back to mock data
      if (import.meta.env.DEV) {
        console.log('Falling back to mock login');
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            // Find user with matching credentials
            const user = mockUsers.find(
              (u) => u.username === credentials.username && u.password === credentials.password
            );

            if (user) {
              // Mock successful login
              const response: LoginResponse = {
                token: `mock-token-${user.username}`,
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  role: user.role,
                }
              };
              
              // Store the token and user info in localStorage
              localStorage.setItem('token', response.token);
              localStorage.setItem('user', JSON.stringify(response.user));
              
              resolve(response);
            } else {
              // Mock failed login
              reject({
                response: {
                  data: { message: 'Invalid credentials' },
                  status: 401
                }
              });
            }
          }, 500); // Simulate network delay
        });
      }
      
      // If not in development or mock login is not enabled, propagate the error
      throw error;
    }
  },
  
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      // Set the Content-Type header explicitly
      console.log('Attempting to register with backend API:', userData);
      const response = await apiClient.post<RegisterResponse>('/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Register response:', response.data);
      
      // Store the token and user info in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({ 
          username: response.data.username, 
          role: response.data.role,
          email: userData.email,
          id: 0 // Since we don't have the ID from the response, default to 0
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Register API error:', error);
      
      // If the API fails and we're in development, fall back to mock data
      if (import.meta.env.DEV) {
        console.log('Falling back to mock registration');
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            // Check if username already exists
            const existingUser = mockUsers.find(u => u.username === userData.username);
            if (existingUser) {
              reject({
                response: {
                  data: { message: 'Username already exists' },
                  status: 400
                }
              });
              return;
            }

            // Mock successful registration
            const response: RegisterResponse = {
              token: `mock-token-${userData.username}`,
              username: userData.username,
              role: userData.role
            };
            
            // Store the token in localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify({ 
              id: mockUsers.length + 1,
              username: response.username, 
              role: response.role,
              email: userData.email
            }));
            
            resolve(response);
          }, 500); // Simulate network delay
        });
      }
      
      // If not in development or mock registration is not enabled, propagate the error
      throw error;
    }
  },
  
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
  
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
  
  hasRole: (role: UserRole | UserRole[]): boolean => {
    const user = AuthService.getCurrentUser();
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  }
};

export default AuthService;
