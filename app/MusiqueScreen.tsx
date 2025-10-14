import { useAuth } from "@/contexts/AuthContext";
import { getUserAbonnements } from "@/services/AbonnementServices";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
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
  const { user } = useAuth();
  const { colors } = useTheme();

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasActiveMusiqueAbo, setHasActiveMusiqueAbo] = useState(false);
  const [checkingAbo, setCheckingAbo] = useState(true);

  // 🔐 Vérifie si l'utilisateur a un abonnement "Musique" actif
  useEffect(() => {
    const checkAbonnement = async () => {
      try {
        const abonnements = await getUserAbonnements(user.uid);
        const abo = abonnements.find((a: any) => a.category === "Musique");

        if (abo) {
          const now = new Date();
          const endDate = new Date(abo.endDate);
          const daysLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          setHasActiveMusiqueAbo(abo.active && daysLeft > 0);
        } else {
          setHasActiveMusiqueAbo(false);
        }
      } catch (error) {
        console.error("Erreur abonnement musique:", error);
        setHasActiveMusiqueAbo(false);
      } finally {
        setCheckingAbo(false);
      }
    };

    checkAbonnement();
  }, [user?.uid]);

  // 🎵 Sélectionner un fichier audio
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

  // ☁️ Upload du fichier
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

  // 💡 Si on vérifie encore l’abonnement
  if (checkingAbo) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Vérification de l'abonnement...</Text>
      </View>
    );
  }

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
          disabled={!hasActiveMusiqueAbo}
        >
          <Ionicons
            name="musical-notes"
            size={24}
            color={hasActiveMusiqueAbo ? colors.primary : "#999"}
          />
          <Text
            style={[
              styles.fileText,
              { color: hasActiveMusiqueAbo ? colors.text : "#999" },
            ]}
          >
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
            {
              backgroundColor: hasActiveMusiqueAbo
                ? colors.primary
                : "rgba(128,128,128,0.4)",
              opacity: uploading ? 0.6 : 1,
            },
          ]}
          onPress={() => {
            if (!hasActiveMusiqueAbo) {
              Alert.alert(
                "Abonnement requis",
                "Vous devez avoir un abonnement actif à la catégorie Musique pour envoyer une musique 🎧"
              );
              return;
            }
            handleUpload();
          }}
          disabled={!hasActiveMusiqueAbo || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={22} color="#fff" />
              <Text style={styles.uploadText}>
                {hasActiveMusiqueAbo ? "Envoyer la musique" : "Verrouillé 🔒"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {!hasActiveMusiqueAbo && (
          <Text style={{ textAlign: "center", marginTop: 10, color: "#ff5555" }}>
            🔒 Cette fonctionnalité est réservée aux abonnés Musique actifs.
          </Text>
        )}
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
