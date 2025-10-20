// screens/MusiqueScreen.tsx

import { useAuth } from "@/contexts/AuthContext";
import { getUserAbonnements } from "@/services/AbonnementServices";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Progress from "react-native-progress";
import MusiqueService, { Song } from "../services/MusiqueService";
// IMPORT REQUIRED FOR MUSIC PLAYBACK
import { Audio } from 'expo-av';

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
  const [musics, setMusics] = useState<Song[]>([]);

  // NEW STATE & REF for Playback
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const soundObjectRef = useRef<Audio.Sound | null>(null);

  // Cleanup effect for audio
  useEffect(() => {
    return () => {
      // Unload the sound when the component is unmounted
      if (soundObjectRef.current) {
        soundObjectRef.current.unloadAsync();
      }
    };
  }, []);

  const checkAbonnement = useCallback(async () => {
    setCheckingAbo(true);
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
    } catch {
      setHasActiveMusiqueAbo(false);
    } finally {
      setCheckingAbo(false);
    }
  }, [user.uid]);

  const fetchMusics = useCallback(async () => {
    try {
      const data = await MusiqueService.getMusics();
      setMusics(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    checkAbonnement();
    fetchMusics();
  }, [checkAbonnement, fetchMusics]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
      if (!result.canceled && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = async () => {
    if (!file || !titre.trim()) {
      Alert.alert("Erreur", "Veuillez sélectionner un fichier audio et entrer un titre.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      await MusiqueService.uploadMusicWithProgress(file, titre, description, (p) => setProgress(p));
      Alert.alert("Succès", "Votre musique a été envoyée avec succès 🎶");
      setTitre("");
      setDescription("");
      setFile(null);
      fetchMusics();
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erreur", error.message || "L’envoi a échoué.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (music: Song) => {
    Alert.alert(
      "Supprimer la musique",
      `Voulez-vous vraiment supprimer "${music.titre}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              // If the music being deleted is currently playing, stop it first
              if (music.id === currentPlayingId) {
                await stopPlayback();
              }
              await MusiqueService.deleteMusic(music.id, music.url);
              fetchMusics();
            } catch (error) {
              console.error(error);
              Alert.alert("Erreur", "Impossible de supprimer la musique.");
            }
          },
        },
      ]
    );
  };

  // --- NEW PLAYBACK LOGIC ---

  const stopPlayback = async () => {
    if (soundObjectRef.current) {
      await soundObjectRef.current.stopAsync();
      await soundObjectRef.current.unloadAsync();
      soundObjectRef.current = null;
    }
    setCurrentPlayingId(null);
  };

  const handlePlayToggle = async (music: Song) => {
    try {
      // 1. If this song is already playing, stop it.
      if (music.id === currentPlayingId) {
        await stopPlayback();
        return;
      }

      // 2. Stop any currently playing song first
      await stopPlayback();

      // 3. Start playing the new song
      const { sound } = await Audio.Sound.createAsync(
        { uri: music.url },
        { shouldPlay: true }
      );
      
      soundObjectRef.current = sound;
      setCurrentPlayingId(music.id);

      // Set up listener for playback completion
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          stopPlayback(); // Stop and reset when the track finishes
        }
      });

    } catch (error) {
      console.error('Error playing music:', error);
      Alert.alert("Erreur de lecture", "Impossible de lire le fichier audio.");
      setCurrentPlayingId(null);
    }
  };

  // --- END NEW PLAYBACK LOGIC ---


  if (checkingAbo) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Vérification de l'abonnement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Upload Form */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={[styles.header, { color: colors.text }]}>Uploader une Musique</Text>
        <TouchableOpacity onPress={checkAbonnement} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <TextInput
          value={titre}
          onChangeText={setTitre}
          style={[styles.input, { borderColor: colors.primary, color: colors.text, backgroundColor: colors.card }]}
          placeholder="Titre de la musique"
          placeholderTextColor="#aaa"
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 80, borderColor: colors.primary, color: colors.text, backgroundColor: colors.card }]}
          multiline
          placeholder="Description"
          placeholderTextColor="#aaa"
        />

        <TouchableOpacity style={[styles.fileButton, { backgroundColor: colors.primary + "22" }]} onPress={pickFile} disabled={!hasActiveMusiqueAbo}>
          <Ionicons name="musical-notes" size={24} color={hasActiveMusiqueAbo ? colors.primary : "#999"} />
          <Text style={[styles.fileText, { color: hasActiveMusiqueAbo ? colors.text : "#999" }]}>{file ? file.name : "Choisir un fichier audio"}</Text>
        </TouchableOpacity>

        {uploading && (
          <View style={{ alignItems: "center", marginVertical: 20 }}>
            <Progress.Bar progress={progress} width={250} color={colors.primary} unfilledColor={colors.card} borderColor={colors.border} borderRadius={10} height={10} />
            <Text style={{ marginTop: 8, color: colors.text }}>{Math.round(progress * 100)}%</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: hasActiveMusiqueAbo ? colors.primary : "rgba(128,128,128,0.4)", opacity: uploading ? 0.6 : 1 }]}
          onPress={() => {
            if (!hasActiveMusiqueAbo) {
              Alert.alert("Abonnement requis", "Vous devez avoir un abonnement actif à la catégorie Musique 🎧");
              return;
            }
            handleUpload();
          }}
          disabled={!hasActiveMusiqueAbo || uploading}
        >
          {uploading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="cloud-upload" size={22} color="#fff" /><Text style={styles.uploadText}>Envoyer la musique</Text></>}
        </TouchableOpacity>
      </View>

      {/* Uploaded Musics List */}
      <Text style={[styles.header, { marginTop: 20, color: colors.text }]}>Vos Musiques</Text>
      <FlatList
        data={musics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isPlaying = item.id === currentPlayingId;
          return (
            <View style={[styles.musicItem, { borderColor: colors.border, backgroundColor: isPlaying ? colors.primary + '10' : colors.background }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{item.titre}</Text>
                <Text style={{ color: colors.text, fontSize: 12 }}>{item.description}</Text>
              </View>
              
              <View style={{ flexDirection: "row", marginTop: 8, alignItems: 'center' }}>
                {/* NEW PLAY BUTTON */}
                <TouchableOpacity 
                  onPress={() => handlePlayToggle(item)} 
                  style={[styles.actionButton, { backgroundColor: isPlaying ? '#ffc107' : colors.primary, width: 40, paddingHorizontal: 0, paddingVertical: 0, marginRight: 10 }]}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
                </TouchableOpacity>

                {/* DELETE BUTTON */}
                <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.actionButton, { backgroundColor: "#ff5555" }]}>
                  <Text style={styles.actionText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default MusiqueScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 20, fontWeight: "700", marginVertical: 10 },
  form: { marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  fileButton: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 15, justifyContent: "center", marginTop: 20 },
  fileText: { marginLeft: 10, fontWeight: "600" },
  uploadButton: { marginTop: 20, paddingVertical: 15, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  uploadText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 16 },
  musicItem: { 
    padding: 12, 
    borderWidth: 1, 
    borderRadius: 12, 
    marginVertical: 6,
    flexDirection: 'row', // To align text and buttons
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center',
    minWidth: 40,
  },
  actionText: { color: "#fff", fontWeight: "600" },
});