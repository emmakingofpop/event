import { resetPassword } from "@/services/UserService";
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

export default function ResetPasswordScreen() {
  const { colors } = useTheme();

  // --- State Management ---
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // --- Inline Error State ---
  const [phoneError, setPhoneError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
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

  // --- Reset Password Handler ---
  const handleReset = async () => {
    Keyboard.dismiss();
    let isValid = true;

    // Reset all errors
    setPhoneError("");
    setNewPasswordError("");
    setConfirmPasswordError("");

    // --- Validation Logic ---
    if (!phoneNumber.trim()) {
      setPhoneError("Le numéro de téléphone est requis.");
      isValid = false;
    }
    if (newPassword.length < 6) {
      setNewPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      isValid = false;
    }
    if (newPassword !== confirmNewPassword) {
      setConfirmPasswordError("Les mots de passe ne correspondent pas.");
      isValid = false;
    }
    if (!isValid) return;

    setIsLoading(true);
    try {
      const response = await resetPassword(phoneNumber, newPassword);
      if (response.success) {
        Alert.alert(
          "Succès",
          "Votre mot de passe a été réinitialisé. Veuillez vous connecter.",
          [{ text: "OK", onPress: () => router.replace("/LoginScreen") }]
        );
      } else {
        Alert.alert("Erreur", response.message || "Impossible de réinitialiser le mot de passe.");
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur inattendue est survenue.");
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
            <Feather name="refresh-cw" size={40} color={colors.primary} />
            <Text style={styles.title}>Réinitialiser le mot de passe</Text>
            <Text style={styles.subtitle}>Entrez vos informations pour continuer</Text>
          </Animated.View>

          {/* --- Form --- */}
          <Animated.View style={[styles.form, formAnimatedStyle]}>
            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Feather name="phone" size={20} color={colors.primary} style={styles.icon} />
              <TextInput style={styles.input} placeholder="+243 970 000 000" placeholderTextColor={colors.border} keyboardType="phone-pad" value={phoneNumber} onChangeText={text => { setPhoneNumber(text); setPhoneError(""); }} />
            </View>
            {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={colors.primary} style={styles.icon} />
              <TextInput style={styles.input} placeholder="Nouveau mot de passe" placeholderTextColor={colors.border} secureTextEntry={!isPasswordVisible} value={newPassword} onChangeText={text => { setNewPassword(text); setNewPasswordError(""); }} />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={20} color={colors.border} />
              </TouchableOpacity>
            </View>
            {newPasswordError && <Text style={styles.errorText}>{newPasswordError}</Text>}

            {/* Confirm New Password Input */}
            <View style={styles.inputContainer}>
              <Feather name="check-circle" size={20} color={colors.primary} style={styles.icon} />
              <TextInput style={styles.input} placeholder="Confirmez le mot de passe" placeholderTextColor={colors.border} secureTextEntry={!isConfirmPasswordVisible} value={confirmNewPassword} onChangeText={text => { setConfirmNewPassword(text); setConfirmPasswordError(""); }} />
              <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
                <Feather name={isConfirmPasswordVisible ? "eye-off" : "eye"} size={20} color={colors.border} />
              </TouchableOpacity>
            </View>
            {confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}

            {/* Reset Button */}
            <TouchableOpacity style={styles.button} onPress={handleReset} disabled={isLoading}>
              {isLoading ? <ActivityIndicator size="small" color={colors.background} /> : <Text style={styles.buttonText}>Réinitialiser</Text>}
            </TouchableOpacity>
          </Animated.View>

          {/* --- Footer Link to Login --- */}
          <Animated.View style={[styles.footer, formAnimatedStyle]}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>
                Retour à la{" "}
                <Text style={styles.linkTextBold}>Connexion</Text>
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