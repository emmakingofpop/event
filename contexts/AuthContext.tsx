// contexts/AuthContext.tsx

// ------------------------------------
// 1. IMPORTS
// ------------------------------------
import { getUser, removeUser, saveUser } from "@/services/storageService";
import { registerForPushNotificationsAsync } from "@/services/useNotifications";
import * as BackgroundFetch from "expo-background-fetch";
import * as Network from "expo-network";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

// ------------------------------------
// 2. TYPES & CONSTANTS
// ------------------------------------

/**
 * Defines the shape of the data accessible via the useAuth hook.
 */
type AuthContextType = {
  user: any | null;
  online: boolean;
  categorie: string;
  item: any;
  expoPushToken: string | null;
  sendNotification: (title: string, body: string, data?: any) => Promise<void>;
  registerBackgroundTask: () => Promise<void>;
  setCat: (cat: string) => void;
  setItems: (it: any) => void;
  login: (user: any) => Promise<void>;
  logout: () => Promise<void>;
};

// Background task identifier
const BACKGROUND_FETCH_TASK = "background-fetch-task";

// ------------------------------------
// 3. CONTEXT CREATION
// ------------------------------------

const AuthContext = createContext<AuthContextType>({
  user: null,
  online: true,
  categorie: "",
  item: null,
  expoPushToken: null,
  sendNotification: async () => {},
  registerBackgroundTask: async () => {},
  setItems: () => {},
  setCat: () => {},
  login: async () => {},
  logout: async () => {},
});

// ------------------------------------
// 4. TASK MANAGER DEFINITION
// ------------------------------------

/**
 * Defines the background task logic for Expo's TaskManager.
 * This runs even when the app is backgrounded or closed.
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  console.log("⏳ Background task running!");

  try {
    // Example: check network first
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
      console.log("No network, skipping notification.");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Example: optionally check some API or local data
    const newDataAvailable = true; // replace with your real check

    if (newDataAvailable) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "LEVRAI",
          body: "New updates are available!",
          data: { type: "background" },
        },
        trigger: null, // show immediately
      });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});


// ------------------------------------
// 5. PROVIDER COMPONENT
// ------------------------------------

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // --- State Initialization ---
  const [user, setUser] = useState<any | null>(null);
  const [online, setOnline] = useState(true);
  const [categorie, setCategorie] = useState("");
  const [item, setItem] = useState<any>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // --- Refs for Notification Listeners ---
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // --- A. Core Logic Functions ---

  const login = async (userData: any) => {
    await saveUser(userData);
    setUser(userData);
  };

  const logout = async () => {
    await removeUser();
    setUser(null);
  };

  const setCat = (cat: string) => setCategorie(cat);
  const setItems = (it: any) => setItem(it);

  const registerBackgroundTask = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) return;

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 60, // every one hour
      stopOnTerminate: false,
      startOnBoot: true,
    });
  };

  const sendNotification = async (
    title: string,
    body: string,
    data: any = {}
  ) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: null, // Instant notification
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };


  // --- B. useEffect Hooks ---

  useEffect(() => {
    registerBackgroundTask();
  }, []);


  // 1. Load Stored User
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await getUser();
      if (storedUser) setUser(storedUser);
    };
    loadUser();
  }, []);

  // 2. Monitor Network Status
  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setOnline(state.isConnected ?? true);
    };

    // Check immediately and then every 5 seconds
    checkNetwork(); 
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  // 3. Initialize Push Notifications
  useEffect(() => {
    const initNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) setExpoPushToken(token);
    };
    initNotifications();

    // Setup listeners for foreground and tap
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("🔔 Notification received:", notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("👆 Notification tapped:", response);
        // Add navigation logic here if needed
      }
    );

    // Cleanup listeners on unmount
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // --- C. Provider Render ---

  const contextValue = {
    user,
    online,
    categorie,
    item,
    expoPushToken,
    registerBackgroundTask,
    sendNotification,
    setItems,
    setCat,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ------------------------------------
// 6. CUSTOM HOOK
// ------------------------------------

/**
 * Custom hook to consume the AuthContext.
 */
export const useAuth = () => useContext(AuthContext);