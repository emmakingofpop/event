// contexts/AuthContext.tsx
import { getUser, removeUser, saveUser } from "@/services/storageService";
import { registerForPushNotificationsAsync } from "@/services/useNotifications";
import * as Network from "expo-network";
import * as Notifications from "expo-notifications";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type AuthContextType = {
  user: any | null;
  online: boolean;
  categorie: string;
  item: any;
  expoPushToken: string | null;
  sendNotification: (title: string, body: string, data?: any) => Promise<void>;
  setCat: (cat: string) => void;
  setItems: (it: any) => void;
  login: (user: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  online: true,
  categorie: "",
  item: null,
  expoPushToken: null,
  sendNotification: async () => {},
  setItems: () => {},
  setCat: () => {},
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [online, setOnline] = useState(true);
  const [categorie, setCategorie] = useState("");
  const [item, setItem] = useState<any>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Load stored user on app start
  useEffect(() => {
    (async () => {
      const storedUser = await getUser();
      if (storedUser) setUser(storedUser);
    })();
  }, []);

  // Monitor network status
  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setOnline(state.isConnected ?? true);
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initialize push notifications
  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) setExpoPushToken(token);
    })();

    // Listen for notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification tapped:", response);
        // You can handle router push here if needed
        // e.g., router.push(response.notification.request.content.data.screen)
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Global function to send a local notification
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

  const setCat = (cat: string) => setCategorie(cat);
  const setItems = (it: any) => setItem(it);

  const login = async (user: any) => {
    await saveUser(user);
    setUser(user);
  };

  const logout = async () => {
    await removeUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        online,
        categorie,
        item,
        expoPushToken,
        sendNotification,
        setItems,
        setCat,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
