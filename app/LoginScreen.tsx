import { useAuth } from "@/contexts/AuthContext";
import { logins } from "@/services/UserService";
import { Feather } from "@expo/vector-icons"; // Using Feather icons
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated"; // For smoother animations

export default function LoginScreen() {
  const { login, user } = useAuth();
  const { colors } = useTheme(); // ✨ Using theme colors

  // State Management
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Reanimated shared values for animations
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);

  // Animated styles
  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  // Trigger animations on screen load
  useEffect(() => {
    formOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(100, withTiming(0, { duration: 600 }));
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user?.success) {
      router.replace("/(tabs)");
    }
  }, [user]);

  // Login Handler
  const handleLogin = async () => {
    // Reset previous errors
    setPhoneError("");
    setPasswordError("");
    Keyboard.dismiss();

    // --- Simple Inline Validation ---
    let isValid = true;
    if (!phoneNumber) {
      setPhoneError("Le numéro de téléphone est requis.");
      isValid = false;
    }
    if (!password) {
      setPasswordError("Le mot de passe est requis.");
      isValid = false;
    }
    if (!isValid) return;

    setIsLoading(true);
    try {
      const userData = await logins(phoneNumber, password);
      if (userData.success) {
        await login(userData);
        // The useEffect hook will handle the redirect
      } else {
        Alert.alert("Échec de la connexion", userData.message || "Veuillez vérifier vos identifiants.");
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize styles to improve performance
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          {/* --- Header --- */}
          <Animated.View style={[styles.header, formAnimatedStyle]}>
            <Feather name="unlock" size={40} color={colors.primary} />
            <Text style={styles.title}>Bienvenue !</Text>
            <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>
          </Animated.View>

          {/* --- Form --- */}
          <Animated.View style={[styles.form, formAnimatedStyle]}>
            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Feather name="phone" size={20} color={colors.primary} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="+243 970 000 000"
                placeholderTextColor={colors.border}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (phoneError) setPhoneError("");
                }}
                autoCapitalize="none"
              />
            </View>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={colors.primary} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={colors.border}
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError("");
                }}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={20} color={colors.border} />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => router.push("/ResetPasswordScreen")}>
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* --- Footer Link to Sign Up --- */}
          <Animated.View style={[styles.footer, formAnimatedStyle]}>
            <TouchableOpacity onPress={() => router.push("/SignUpScreen")}>
              <Text style={styles.linkText}>
                Pas encore de compte ?{" "}
                <Text style={styles.linkTextBold}>Inscrivez-vous</Text>
              </Text>
            </TouchableOpacity>
                
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ✨ Styles factory function for theming and memoization
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    innerContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 16,
    },
    subtitle: {
      fontSize: 16,
      marginTop: 8,
    },
    form: {
      width: "100%",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      
      borderColor: colors.primary, // Initially transparent
      marginBottom: 4, // Space for error text
      paddingHorizontal: 12,
    },
    icon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      height: 50,
      fontSize: 16,
      color: colors.text,
    },
    eyeIcon: {
      padding: 5,
    },
    errorText: {
        color: colors.notification,
        fontSize: 12,
        marginLeft: 12,
        marginBottom: 12, // Space after error
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: colors.primary,
        fontSize: 14,
    },
    button: {
      height: 50,
      backgroundColor: colors.primary,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 8,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: "bold",
    },
    footer: {
      marginTop: 30,
      alignItems: 'center',
    },
    linkText: {
      color: colors.border,
      fontSize: 14,
    },
    linkTextBold: {
      color: colors.primary,
      fontWeight: "bold",
    },
  });