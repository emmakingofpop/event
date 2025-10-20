import { useAuth } from "@/contexts/AuthContext";
import { signup } from "@/services/UserService";
import { Feather } from "@expo/vector-icons";
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
} from "react-native-reanimated";

export default function SignUpScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();

  // --- State Management ---
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // --- Inline Error State ---
  const [usernameError, setUsernameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // --- Reanimated Values for Animations ---
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  // --- Trigger Animation on Load ---
  useEffect(() => {
    formOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(100, withTiming(0, { duration: 600 }));
  }, []);

  // --- Sign Up Handler ---
  const handleSignUp = async () => {
    Keyboard.dismiss();
    let isValid = true;

    // Reset all errors
    setUsernameError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // --- Validation Logic ---
    if (!username.trim()) {
      setUsernameError("Le nom d'utilisateur est requis.");
      isValid = false;
    }
    if (!phoneNumber.trim()) {
      setPhoneError("Le numéro de téléphone est requis.");
      isValid = false;
    }
    if (password.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Les mots de passe ne correspondent pas.");
      isValid = false;
    }
    if (!isValid) return;

    setIsLoading(true);
    try {
      const user = await signup(username, phoneNumber, password);
      if (user.success) {
        await login(user);
        Alert.alert("Bienvenue !", "Votre compte a été créé avec succès.");
        router.replace("/(tabs)/profile"); // Redirect to profile to complete it
      } else {
        Alert.alert("Erreur d'inscription", user.message);
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Échec de la création du compte.");
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize styles for performance
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
            <Feather name="user-plus" size={40} color={colors.primary} />
            <Text style={styles.title}>Créez votre compte</Text>
            <Text style={styles.subtitle}>Rejoignez-nous en quelques étapes</Text>
          </Animated.View>

          {/* --- Form --- */}
          <Animated.View style={[styles.form, formAnimatedStyle]}>
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color={colors.primary} style={styles.icon} />
              <TextInput style={styles.input} placeholder="Nom d'utilisateur" placeholderTextColor={colors.border} value={username} onChangeText={text => { setUsername(text); setUsernameError(""); }} />
            </View>
            {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Feather name="phone" size={20} color={colors.primary} style={styles.icon} />
              <TextInput style={styles.input} placeholder="+243 970 000 000" placeholderTextColor={colors.border} keyboardType="phone-pad" value={phoneNumber} onChangeText={text => { setPhoneNumber(text); setPhoneError(""); }} />
            </View>
            {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={colors.primary} style={styles.icon} />
              <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor={colors.border} secureTextEntry={!isPasswordVisible} value={password} onChangeText={text => { setPassword(text); setPasswordError(""); }} />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={20} color={colors.border} />
              </TouchableOpacity>
            </View>
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

             {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Feather name="check-circle" size={20} color={colors.primary} style={styles.icon} />
              <TextInput style={styles.input} placeholder="Confirmez le mot de passe" placeholderTextColor={colors.border} secureTextEntry={!isConfirmPasswordVisible} value={confirmPassword} onChangeText={text => { setConfirmPassword(text); setConfirmPasswordError(""); }} />
               <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
                <Feather name={isConfirmPasswordVisible ? "eye-off" : "eye"} size={20} color={colors.border} />
              </TouchableOpacity>
            </View>
            {confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}


            {/* SignUp Button */}
            <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={isLoading}>
              {isLoading ? <ActivityIndicator size="small" color={colors.background} /> : <Text style={styles.buttonText}>S’inscrire</Text>}
            </TouchableOpacity>
          </Animated.View>

          {/* --- Footer Link to Login --- */}
          <Animated.View style={[styles.footer, formAnimatedStyle]}>
            <TouchableOpacity onPress={() => router.push("/LoginScreen")}>
              <Text style={styles.linkText}>
                Vous avez déjà un compte ?{" "}
                <Text style={styles.linkTextBold}>Connectez-vous</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ✨ Styles factory function for theming
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
      marginBottom: 30,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      marginTop: 8,
      textAlign: 'center',
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
      borderColor: colors.primary,
      paddingHorizontal: 12,
      marginTop: 16,
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
      marginTop: 4,
    },
    button: {
      height: 50,
      backgroundColor: colors.primary,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 24,
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
      alignItems: "center",
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