import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as Progress from "react-native-progress";
import MusiqueService from "../services/MusiqueService";

const MusiqueScreen = () => {
  const { colors } = useTheme(); // 🎨 Prend les couleurs du thème

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sélectionner un fichier audio 🎵
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });

      if (!result.canceled && result.assets.length > 0) {
        const picked = result.assets[0];
        setFile(picked);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Upload du fichier
  const handleUpload = async () => {
    if (!file || !titre.trim()) {
      Alert.alert("Erreur", "Veuillez sélectionner un fichier audio et entrer un titre.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      await MusiqueService.uploadMusicWithProgress(
        file,
        titre,
        description,
        (p: number) => setProgress(p)
      );
      Alert.alert("Succès", "Votre musique a été envoyée avec succès 🎶");
      setTitre("");
      setDescription("");
      setFile(null);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erreur", error.message || "L’envoi a échoué.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Uploader une Musique</Text>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Titre</Text>
        <TextInput
          value={titre}
          onChangeText={setTitre}
          style={[
            styles.input,
            { borderColor: colors.primary, color: colors.text, backgroundColor: colors.card },
          ]}
          placeholder="Titre de la musique"
          placeholderTextColor="#aaa"
        />

        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[
            styles.input,
            {
              height: 80,
              borderColor: colors.primary,
              color: colors.text,
              backgroundColor: colors.card,
            },
          ]}
          multiline
          placeholder="Décrivez la musique..."
          placeholderTextColor="#aaa"
        />

        <TouchableOpacity
          style={[styles.fileButton, { backgroundColor: colors.primary + "22" }]}
          onPress={pickFile}
        >
          <Ionicons name="musical-notes" size={24} color={colors.primary} />
          <Text style={[styles.fileText, { color: colors.text }]}>
            {file ? file.name : "Choisir un fichier audio"}
          </Text>
        </TouchableOpacity>

        {uploading && (
          <View style={{ alignItems: "center", marginVertical: 20 }}>
            <Progress.Bar
              progress={progress}
              width={250}
              color={colors.primary}
              unfilledColor={colors.card}
              borderColor={colors.border}
              borderRadius={10}
              height={10}
            />
            <Text style={{ marginTop: 8, color: colors.text }}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.uploadButton,
            { backgroundColor: colors.primary },
            uploading && { opacity: 0.7 },
          ]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={22} color="#fff" />
              <Text style={styles.uploadText}>Envoyer la musique</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MusiqueScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 20,
  },
  form: { marginTop: 10 },
  label: {
    fontWeight: "600",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 15,
    justifyContent: "center",
    marginTop: 20,
  },
  fileText: {
    marginLeft: 10,
    fontWeight: "600",
  },
  uploadButton: {
    marginTop: 30,
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
});
