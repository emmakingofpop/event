import AsyncStorage from "@react-native-async-storage/async-storage";

// Save user to AsyncStorage
export const saveUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem("@user_levrai", JSON.stringify(user));
  } catch (error) {
    console.error("Error saving user to AsyncStorage:", error);
    throw error;
  }
};

// Get user from AsyncStorage
export const getUser = async (): Promise<any | null> => {
  try {
    const userData = await AsyncStorage.getItem("@user_levrai");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

// Optional: remove user (logout)
export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("@user_levrai");
  } catch (error) {
    throw error;
  }
};
