import { useAuth } from "@/contexts/AuthContext";
import { getArticlesByCategory } from "@/services/articleService";
import { createProfile, updateProfileByUid } from "@/services/profileService";
import { souscat } from '@/type/type';
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from '@react-navigation/native';
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Animated, Easing, FlatList, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PostulerService } from '../services/postulerService';
import Header from './components/header';

// -------------------------------------------------------------------------
// Types pour le profil
// -------------------------------------------------------------------------
interface ProfileData {
  id?: string;
  uid: string;
  fullName: string;
  description: string;
  age: string;
  tel: string;
  sex: string;
  images: any[];
  created_at: string;
}
// -------------------------------------------------------------------------

const Postuler = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1); // 1: Profil, 2: Candidature
  const [isLoading, setIsLoading] = useState(false);

  // --- États pour le Profil ---
  const [profileId, setProfileId] = useState<string>(''); // Utilisé pour savoir si on crée ou on met à jour
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");
  const [tel, setTel] = useState("");
  const [sex, setSex] = useState("Homme");
  const [photos, setPhotos] = useState<string[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false); // Pour le spinner de chargement initial

  const spinAnim = useMemo(() => new Animated.Value(0), []);
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // --- États pour la Candidature ---
  const [typeselected, setTypeSelected] = useState<string>("");
  const [datas, setData] = useState<any[]>([]);
  const [eventId, setEventId] = useState<string>('');
  const [souscategorie, setSouscategorie] = useState<string>('');
  const [numero, setNumero] = useState<string>(''); // Numéro de candidat unique


  
    // Load articles
    useEffect(() => {
      let isMounted = true;
      const getArticlesByCategori = async () => {
        try {
          const res = await getArticlesByCategory('Événements');
          if (isMounted && res) {
            const filtered = res.filter(
              (cat: any) =>
                cat.style === 'concour miss' || cat.style === "ballon d'or"
            );
            setData(filtered);
          }
        } catch{
          
        }
      };
      getArticlesByCategori();
      return () => {
        isMounted = false;
      };
    }, []);


  // 2. LOGIQUE DE GESTION DES IMAGES DU PROFIL (Inchagée)
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

  // 3. CRÉATION OU MISE À JOUR DU PROFIL (Étape 1)
  const handleProfileSubmit = async () => {
    if (!fullName || !description || !age || !tel) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires du profil.");
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
      const profileData: ProfileData = {
        uid: profileId || "anonymous",
        fullName,
        description,
        age,
        tel,
        sex,
        images: photos,
        created_at: new Date().toISOString(),
      };

      if (profileId) {
        // Mise à jour du profil existant
        await updateProfileByUid(profileId, profileData);
        Alert.alert("Succès", "Profil mis à jour ! ✅ Vous pouvez maintenant postuler.");
      } else {
        // Création d'un nouveau profil
        const newProfile = await createProfile(profileData);
        if (newProfile && newProfile.id) {
            setProfileId(newProfile.id); // Stocker l'ID pour les mises à jour futures
        }
        Alert.alert("Succès", "Profil créé avec succès ! 🎉 Vous pouvez maintenant postuler.");
      }

      setStep(2); // Passer à l'étape de candidature
    } catch  {
      Alert.alert("Erreur", "Impossible de soumettre/mettre à jour le profil.");
    } finally {
      setIsLoading(false);
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  };

  // 4. SOUMISSION DE LA CANDIDATURE (Étape 2)
  const handleApplicationSubmit = async () => {
    if (!typeselected) {
      Alert.alert("Attention", "Veuillez sélectionner un type d'événement.");
      return;
    }
    if (!numero.trim()) {
      Alert.alert("Attention", "Veuillez entrer votre numéro de candidat.");
      return;
    }

    try {
      setIsLoading(true);

      const uid = profileId;
      if (!uid) {
        Alert.alert("Erreur", "Utilisateur non connecté.");
        return;
      }

      const postulerData = {
        uid,
        eventId,
        category: souscategorie || typeselected,
        numero,
      };

      // Vérifier si une candidature existe déjà pour cet événement
      const existing = await PostulerService.getPostulersByUid(uid);
      const duplicate = existing.find(p => p.eventId === eventId);

      if (duplicate) {
        await PostulerService.updatePostuler(duplicate.id!, postulerData);
        Alert.alert("Succès🎉", `Votre candidature pour "${typeselected}" a été mise à jour !`);
      } else {
        await PostulerService.createPostuler(postulerData);
        Alert.alert("Succès🎉", `Votre candidature pour "${typeselected}" a été soumise avec succès !`);
      }

      // -------------------------------------------------------------------------
      // Logique pour permettre l'inscription du candidat suivant
      // -------------------------------------------------------------------------
      setTypeSelected("");
      setSouscategorie("");
      setProfileId("");
      setNumero(""); // Réinitialiser le champ numéro
      // ** Retourner à l'étape 1 pour une nouvelle inscription ou modification de profil **
      setStep(1); 
      // -------------------------------------------------------------------------

    } catch {
      Alert.alert("Erreur","Une erreur est survenue lors de la soumission de la candidature.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. RENDU DE L'ÉTAPE 1 : PROFIL
  const renderProfileStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={[styles.card, { paddingBottom: 70, maxHeight: '80%', }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>{profileId ? "Mettre à Jour mon Profil" : "Créer mon Profil Candidat"}</Text>
          <Text style={{ textAlign: 'center', marginBottom: 20, color: colors.text }}>
            Étape 1/2 : Veuillez {profileId ? "vérifier et mettre à jour" : "remplir"} votre profil avant de postuler.
          </Text>

          {/* ... Champs de saisie du profil ... */}
          <TextInput
            style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
            placeholder="Nom complet"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
            placeholder="Numéro de téléphone"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={tel}
            onChangeText={setTel}
          />

          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.primary, color: colors.text, height: 100, textAlignVertical:
                  "top"
              },
            ]}
            placeholder="Description"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <TextInput
            style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
            placeholder="Âge"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />

          <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
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
            onPress={handleProfileSubmit}
            disabled={isLoading}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isLoading && (
                <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 6 }}>
                  <Ionicons name="sync" size={24} color="#fff" />
                </Animated.View>
              )}
              <Text style={styles.buttonText}>
                {profileId ? "Mettre à jour le Profil & Continuer" : "Créer le Profil & Continuer"}
              </Text>
            </View>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );

  // 6. RENDU DE L'ÉAPE 2 : CANDIDATURE
  const renderApplicationStep = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Postuler à l‘Événement</Text>
      <Text style={{ textAlign: 'center', marginBottom: 20, color: colors.text }}>
        Étape 2/2 : Choisissez l‘événement pour lequel vous souhaitez postuler.
      </Text>

      {/* Bouton pour revenir au profil (pour Update/Modification) */}
      <TouchableOpacity
        style={[styles.backButton, { borderColor: colors.primary }]}
        onPress={() => setStep(1)}
      >
        <Ionicons name="arrow-back" size={18} color={colors.primary} />
        <Text style={[styles.backButtonText, { color: colors.primary }]}>Retour & Modifier mon Profil</Text>
      </TouchableOpacity>

      {/* Sélecteur de type d'événement */}
      <View style={[styles.pickerWrapper, { borderColor: colors.primary, marginTop: 20 }]}>
        <Picker
          selectedValue={typeselected}
          onValueChange={(itemValue) => {
            const [style, idx] = itemValue.split('|');
            setTypeSelected(style);
            setEventId(idx);
            setSouscategorie("");
          }}
          style={[styles.picker, { color: colors.text }]}
          dropdownIconColor={colors.primary}
        >
          <Picker.Item label="Sélectionnez l'événement" value="" />
          {datas.map((cat, idx) => (
            <Picker.Item
              key={idx}
              label={cat.title}
              value={`${cat.style}|${cat.id}`}
            />
          ))}
        </Picker>
      </View>

      {/* Sous-catégorie pour Ballon d'Or */}
      {typeselected === "ballon d'or" && (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.label, { color: colors.text }]}>Choisissez la sous-catégorie :</Text>
          <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
            <Picker
              selectedValue={souscategorie}
              onValueChange={(itemValue) => setSouscategorie(itemValue)}
              style={[styles.picker, { color: colors.text }]}
              dropdownIconColor={colors.primary}
            >
              <Picker.Item label="Sélectionnez" value="" />
              {souscat.map((cat, idx) => (
                <Picker.Item key={idx} label={cat.title} value={cat.title} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* ✅ Champ numéro du candidat unique */}
      <View style={{ marginTop: 20 }}>
        <Text style={[styles.label, { color: colors.text }]}>Numéro du candidat :</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
          placeholder="Entrez le numéro du candidat"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={numero}
          onChangeText={setNumero}
        />
      </View>

      {/* Bouton de soumission de la candidature */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
        onPress={handleApplicationSubmit}
        disabled={isLoading || !typeselected}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Envoi en cours..." : "Soumettre la Candidature"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // 7. RENDU PRINCIPAL
  return (
    <View style={{ flex: 1 }}>
      <Header />
      {!profileLoaded && (
        step === 1 ? renderProfileStep() : renderApplicationStep()
      )}
    </View>
  );
};

// 8. Styles Fusionnés
const styles = StyleSheet.create({
  // Styles de base et du conteneur
  container: { flex: 1, padding: 16, marginTop: 20, paddingBottom: 70 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginHorizontal: 5,
    fontWeight: "600",
    marginBottom: 6,
  },
  card: {
    marginTop: 20
  },

  // Composants de formulaire (Input, Picker)
  input: {
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    fontSize: 16,
    height: 50,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
  },

  // Boutons
  button: { padding: 16, borderRadius: 16, marginTop: 16, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    marginBottom: 10,
  },
  backButtonText: {
    marginLeft: 8,
    fontWeight: '600',
  },


  // Images (Profil)
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    justifyContent: "center",
  },
  imageButtonText: { color: "#fff", marginLeft: 8, fontWeight: "600" },
  preview: { width: 80, height: 80, marginRight: 10, marginBottom: 20 },
  deleteButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 5,
    borderRadius: 20,
    position: "absolute",
    top: 5,
    right: 5,
  },
});

export default Postuler;