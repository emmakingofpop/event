import { useAuth } from "@/contexts/AuthContext";
import {
  createProfile,
  getProfileByUid,
  updateProfileByUid,
} from "@/services/profileService";
import { Feather, Ionicons } from "@expo/vector-icons"; // Added Feather for more icons
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Redirect, router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme(); // ✨ Use theme colors

  // State management
  const [fullName, setFullName] = useState("");
  const [tel, setTel] = useState("");
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("Homme"); // Default to "Homme"
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkProfile, setCheckProfile] = useState("");

  // Animation for loading spinner
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  // Fetch user profile on component mount
  useEffect(() => {
    if (!user?.uid) return;
    const fetchProfile = async () => {
      try {
        const res = await getProfileByUid(user.uid);
        if (res && res.length > 0) {
          const data = res[0];
          setFullName(data.fullName || "");
          setTel(data.tel || "");
          setDescription(data.description || "");
          setAge(String(data.age || "")); // Ensure age is a string for TextInput
          setSex(data.sex || "Homme");
          setPhoto(data.images?.[0] || null);
          setCheckProfile("full");
        } else {
          setCheckProfile("empty");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, [user]);

  // Image picker logic
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  // Form submission logic
  const handleSubmit = async () => {
    if (!fullName || !tel || !description || !age) {
      Alert.alert("Champs incomplets", "Veuillez remplir tous les champs.");
      return;
    }

    setIsLoading(true);
    try {
      const profileData = {
        uid: user?.uid || "anonymous",
        fullName,
        tel,
        description,
        age: parseInt(age, 10), // Store age as a number
        sex,
        images: photo ? [photo] : [],
        created_at: new Date().toISOString(),
      };

      if (checkProfile === "empty") {
        await createProfile(profileData);
      } else {
        await updateProfileByUid(user?.uid, profileData);
      }

      Alert.alert("Succès", "Votre profil a été mis à jour avec succès !");
      router.push("/(tabs)");
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!user) return <Redirect href="/LoginScreen" />;

  // Component to render input fields
  const renderInput = (
    label: string,
    icon: any,
    placeholder: string,
    value: string,
    setter: (text: string) => void,
    keyboardType: any = "default",
    multiline = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Feather name={icon} size={20} color={colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor={colors.border}
          value={value}
          onChangeText={setter}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage}>
            <ImageBackground
              source={
                photo
                  ? { uri: photo }
                  : require("@/assets/images/avatar-placeholder.png")
              }
              style={styles.avatar}
              imageStyle={{ borderRadius: 60 }}
            >
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={22} color={colors.card} />
              </View>
            </ImageBackground>
          </TouchableOpacity>
          <Text style={styles.username}>
            {fullName || user.username || "Utilisateur"}
          </Text>
          <Text style={styles.subtext}>{user.email}</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {renderInput("Nom Complet", "user", "Entrez votre nom...", fullName, setFullName)}
          {renderInput("Téléphone", "phone", "Votre numéro...", tel, setTel, "phone-pad")}
          {renderInput("Âge", "hash", "Votre âge...", age, setAge, "numeric")}
          {renderInput("Description", "align-left", "Parlez de vous...", description, setDescription, "default", true)}

          {/* Sex Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sexe</Text>
            <View style={styles.sexSelector}>
              <TouchableOpacity
                style={[styles.sexOption, sex === "Homme" && styles.sexOptionActive]}
                onPress={() => setSex("Homme")}
              >
                <Text style={[styles.sexText, sex === "Homme" && styles.sexTextActive]}>
                  Homme
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sexOption, sex === "Femme" && styles.sexOptionActive]}
                onPress={() => setSex("Femme")}
              >
                <Text style={[styles.sexText, sex === "Femme" && styles.sexTextActive]}>
                  Femme
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="sync" size={24} color={colors.background} />
            </Animated.View>
          ) : (
            <Text style={styles.buttonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={logout}
        >
          <Text style={[styles.buttonText, styles.logoutButtonText]}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ✨ Function to create styles based on theme colors
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      paddingHorizontal: 20,
      paddingVertical: 30,
    },
    header: {
      alignItems: "center",
      marginBottom: 30,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.border,
      borderWidth: 3,
      borderColor: colors.primary,
    },
    cameraOverlay: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 8,
      borderWidth: 2,
      borderColor: colors.card,
    },
    username: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "bold",
      marginTop: 15,
    },
    subtext: {
      color: colors.border,
      fontSize: 16,
    },
    form: {
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      marginLeft: 4,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      paddingHorizontal: 12,
    },
    input: {
      flex: 1,
      color: colors.text,
      paddingVertical: 14,
      paddingRight: 14,
      fontSize: 16,
    },
    multilineInput: {
      height: 120,
      textAlignVertical: "top",
      paddingTop: 14,
    },
    sexSelector: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    sexOption: {
      flex: 1,
      paddingVertical: 14,
      alignItems: "center",
    },
    sexOptionActive: {
      backgroundColor: colors.primary,
    },
    sexText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    sexTextActive: {
      color: colors.background,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    buttonText: {
      color: colors.card,
      fontWeight: "bold",
      fontSize: 18,
    },
    logoutButton: {
      backgroundColor: "transparent",
      borderColor: colors.notification,
      borderWidth: 1,
      marginTop: 16,
    },
    logoutButtonText: {
      color: colors.notification,
    },
  });