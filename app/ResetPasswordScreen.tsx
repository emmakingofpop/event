import { resetPassword } from "@/services/UserService";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Easing,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function ResetPasswordScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  const handleReset = async () => {
    if (!phoneNumber || !newPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await resetPassword(phoneNumber, newPassword);
      setIsLoading(false);
      if (user.success) {
        
        Alert.alert("Succès", "Mot de passe réinitialisé !");
        router.replace("/(tabs)");
      } else {
        Alert.alert("Erreur", user.message);
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert("Erreur", error.message || "Échec de la réinitialisation.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={require("../assets/images/bg.jpeg")}
        style={styles.bg}
        blurRadius={15}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Réinitialiser le mot de passe</Text>

            <TextInput
              style={styles.input}
              placeholder="+243 97 000 0000"
              placeholderTextColor="#ccc"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <TextInput
              style={styles.input}
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#ccc"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleReset}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {isLoading && (
                  <Animated.View style={{ transform: [{ rotate }] }}>
                    <Svg width={30} height={30} viewBox="0 0 100 100">
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
                <Text style={styles.buttonText}>Réinitialiser</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/LoginScreen")}>
              <Text style={styles.linkText}>
                Retour à la connexion
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },
  container: { flex: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "rgba(255,255,255,0.18)",
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 28,
    textAlign: "center",
    color: "#fff",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    color: "#fff",
  },
  button: {
    backgroundColor: "#032D23",
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.5 },
  linkText: { color: "#fff", textAlign: "center", fontSize: 14, opacity: 0.9 },
});
