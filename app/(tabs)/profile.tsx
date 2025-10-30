import { useAuth } from "@/contexts/AuthContext";
import { createProfile, getProfileByUid, updateProfileByUid } from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
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

export default function Profile() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");
  const [tel, setTel] = useState(""); // 🔹 Added phone number
  const [id, setId] = useState("");
  const [sex, setSex] = useState("Homme");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkProfile, setCheckProfile] = useState("");

  const spinAnim = new Animated.Value(0);
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos([...photos, ...uris]);
    }
  };

  useEffect(() => {
    const getProfileById = async (uid: string) => {
      try {
        const res = await getProfileByUid(uid);
        if (res && res.length > 0) {
          const data = res[0];
          setId(data.id);
          setFullName(data.fullName || "");
          setDescription(data.description || "");
          setAge(data.age || "");
          setTel(data.tel || ""); // 🔹 load existing phone
          setSex(data.sex || "Homme");
          setPhotos(data.images || []);
          setCheckProfile("full");
        } else {
          setCheckProfile("empty");
        }
      } catch (error) {
        console.error(error);
      }
    };

    getProfileById(user?.uid);
  }, [user]);

  const handleSubmit = async () => {
    if (!fullName || !description || !age || !tel) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsLoading(true);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    try {
      const profileData = {
        uid: user?.uid || "anonymous",
        fullName,
        description,
        age,
        tel, // 🔹 include phone number
        sex,
        images: photos,
        created_at: new Date().toISOString(),
      };

      if (checkProfile === "empty") {
        await createProfile(profileData);
      } else {
        await updateProfileByUid(user?.uid, profileData);
      }

      Alert.alert("Succès", "Profil soumis avec succès !");
      router.push("/(tabs)");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de soumettre le profil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={[styles.card,{paddingBottom: 70,maxHeight:'80%',}]}
          keyboardShouldPersistTaps="handled"
          >
        <Text style={[styles.title, { color: colors.text }]}>Profil</Text>

        <TextInput
          style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
          placeholder="Nom complet"
          placeholderTextColor="#ccc"
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
          placeholder="Numéro de téléphone"
          placeholderTextColor="#ccc"
          keyboardType="phone-pad"
          value={tel}
          onChangeText={setTel}
        />

        <TextInput
          style={[
            styles.input,
            { borderColor: colors.primary, color: colors.text, height: 100, textAlignVertical: "top" },
          ]}
          placeholder="Description"
          placeholderTextColor="#ccc"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TextInput
          style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
          placeholder="Âge"
          placeholderTextColor="#ccc"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={sex}
            onValueChange={(v) => setSex(v)}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.primary}
          >
            <Picker.Item label="Homme" value="Homme" />
            <Picker.Item label="Femme" value="Femme" />
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.imageButton, { backgroundColor: colors.primary }]}
          onPress={pickImages}
        >
          <Ionicons name="images" size={22} color="#fff" />
          <Text style={styles.imageButtonText}>Ajouter des photos</Text>
        </TouchableOpacity>

        <FlatList
          data={photos}
          horizontal
          keyExtractor={(item, i) => i.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <ImageBackground source={{ uri: item }} style={styles.preview} imageStyle={{ borderRadius: 12 }}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => setPhotos(photos.filter((p) => p !== item))}
              >
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            </ImageBackground>
          )}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isLoading && (
              <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 6 }}>
                <Ionicons name="sync" size={24} color="#fff" />
              </Animated.View>
            )}
            <Text style={styles.buttonText}>Soumettre le Profil</Text>
          </View>
        </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 20,},
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  input: {
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: { height: 50 },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    justifyContent: "center",
  },
  imageButtonText: { color: "#fff", marginLeft: 8, fontWeight: "600" },
  preview: { width: 80, height: 80, marginRight: 10 },
  deleteButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 5,
    borderRadius: 20,
    position: "absolute",
    top: 5,
    right: 5,
  },
    card: {
    marginTop:20
  },
  button: { padding: 16, borderRadius: 16, marginTop: 16, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
