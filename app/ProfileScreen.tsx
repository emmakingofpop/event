import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function ProfileScreen() {
  const { logout,user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  


  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Load user from AsyncStorage
 if (!user) {
    // User is not logged in → go to login
    return <Redirect href="/LoginScreen" />;
  }else{
    console.log(user)
  }
  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Mon Profil</Text>
        <Text style={styles.label}>Nom:</Text>
        <Text style={styles.value}>{user.username || "Non défini"}</Text>

        <Text style={styles.label}>Téléphone:</Text>
        <Text style={styles.value}>{user.phoneNumber || "Non défini"}</Text>

        <TouchableOpacity style={styles.button} onPress={() => logout()}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            {isLoading && (
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Svg width={25} height={25} viewBox="0 0 100 100">
                  <Circle
                    cx="50"
                    cy="50"
                    r="35"
                    stroke="white"
                    strokeWidth="10"
                    strokeDasharray="164.9 56.97"
                    fill="none"
                  />
                </Svg>
              </Animated.View>
            )}
            <Text style={styles.buttonText}>Déconnexion</Text>
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#032D23" },
  card: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 28,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 28, textAlign: "center", color: "#fff" },
  label: { color: "#fff", fontSize: 16, marginTop: 12 },
  value: { color: "#fff", fontSize: 20, fontWeight: "600", marginBottom: 8 },
  button: {
    backgroundColor: "#045D56",
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#032D23" },
});
