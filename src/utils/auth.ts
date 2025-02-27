
import { toast } from "sonner";

// Simple user interface
export interface User {
  id: string;
  email: string;
  name: string;
  notificationsEnabled: boolean;
}

// Local storage keys
const USER_KEY = "stampify-user";
const USERS_KEY = "stampify-users";

// Simulate user registration
export const registerUser = (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  return new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Get existing users
      const usersJson = localStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : {};

      // Check if email is already registered
      if (users[email]) {
        reject(new Error("Email already registered"));
        return;
      }

      // Create a new user
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        notificationsEnabled: true,
      };

      // Add password to users object (in a real app, this would be properly hashed)
      users[email] = { password, userId: newUser.id };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Store all users except their passwords in a users array
      const currentUsers = getAllUsers();
      currentUsers.push(newUser);
      localStorage.setItem("stampify-all-users", JSON.stringify(currentUsers));

      // Set current user
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));

      resolve(newUser);
    }, 800);
  });
};

// Simulate user login
export const loginUser = (
  email: string,
  password: string
): Promise<User> => {
  return new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Get existing users
      const usersJson = localStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : {};

      // Check if user exists and password matches
      const user = users[email];
      if (!user || user.password !== password) {
        reject(new Error("Invalid email or password"));
        return;
      }

      // Get user from all users
      const allUsersJson = localStorage.getItem("stampify-all-users");
      const allUsers = allUsersJson ? JSON.parse(allUsersJson) : [];
      const userData = allUsers.find((u: User) => u.id === user.userId);

      if (!userData) {
        reject(new Error("User data not found"));
        return;
      }

      // Set current user
      localStorage.setItem(USER_KEY, JSON.stringify(userData));

      resolve(userData);
    }, 800);
  });
};

// Get current user
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  return JSON.parse(userJson);
};

// Logout user
export const logoutUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Update user profile
export const updateUserProfile = (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Get all users
      const allUsersJson = localStorage.getItem("stampify-all-users");
      const allUsers = allUsersJson ? JSON.parse(allUsersJson) : [];
      
      // Find the user to update
      const userIndex = allUsers.findIndex((u: User) => u.id === userId);
      
      if (userIndex === -1) {
        reject(new Error("User not found"));
        return;
      }
      
      // Update the user
      const updatedUser = {
        ...allUsers[userIndex],
        ...updates,
      };
      
      allUsers[userIndex] = updatedUser;
      
      // Save back to localStorage
      localStorage.setItem("stampify-all-users", JSON.stringify(allUsers));
      
      // If this is the current user, update the current user as well
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }
      
      resolve(updatedUser);
    }, 600);
  });
};

// Reset password (simplified version)
export const resetPassword = (email: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Get existing users
      const usersJson = localStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : {};
      
      // Check if user exists
      if (!users[email]) {
        reject(new Error("Email not registered"));
        return;
      }
      
      // In a real app, this would send an email with a reset link
      // Here we'll just simulate success
      toast.success("Password reset email sent. Check your inbox!");
      resolve(true);
    }, 1000);
  });
};

// Get all users (helper function)
const getAllUsers = (): User[] => {
  const allUsersJson = localStorage.getItem("stampify-all-users");
  return allUsersJson ? JSON.parse(allUsersJson) : [];
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
