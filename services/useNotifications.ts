import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ✅ Updated handler to match the new NotificationBehavior type
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // ✅ new
    shouldShowList: true,   // ✅ new
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Permission to receive notifications was denied.");
      return;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn("No EAS project ID found in app config.");
      return;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenResponse.data;
  } else {
    alert("Must use a physical device for push notifications");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
