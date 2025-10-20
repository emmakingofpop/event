import { FactureService } from '@/services/FactureService';
import { Like, LikeService } from '@/services/likeService';
import { Postuler, PostulerService } from '@/services/postulerService';
import { getProfileByUid } from '@/services/profileService';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from './components/header';

const COLORS = {
  primary: '#6200EE',
  primaryVariant: '#3700B3',
  secondary: '#03DAC6',
  background: '#F6F8FA',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#888888',
  white: '#FFFFFF',
  danger: '#B00020',
  success: '#00C853',
  disabled: '#CCCCCC',
};

type Profile = {
  id: string;
  uid: string;
  fullName: string;
  age: string;
  sex: string;
  description: string;
  photos: string[];
};

const GererLikeScreen = () => {
  const [numero, setNumero] = useState('');
  const [factureNumber, setFactureNumber] = useState('');
  const [likesToAdd, setLikesToAdd] = useState('1');
  const [profile, setProfile] = useState<Profile[] | null>(null);
  const [likes, setLikes] = useState<Like[]>([]);
  const [postuler, setPostuler] = useState<Postuler[]>([]);
  const [loading, setLoading] = useState(false);
  const [addLikeLoading, setAddLikeLoading] = useState(false);
  const [editingLikeId, setEditingLikeId] = useState<string | null>(null);
  const [editedLikes, setEditedLikes] = useState<Record<string, string>>({});

  // ✅ Fetch profile, facture, and likes
  const handleFetch = async () => {
    if (!numero || !factureNumber) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    setProfile(null);
    setLikes([]);

    try {
      const postulers = await PostulerService.getPostulersByNumero(numero);
      if (!postulers || postulers.length === 0) {
        Alert.alert('Introuvable', 'Aucun candidat trouvé pour ce numéro.');
        return;
      }

      const uid = postulers[0].uid;
      setPostuler(postulers);
      const factures = await FactureService.getFacturesByfactureNumberfactureNumber(factureNumber);
      if (!factures || factures.length === 0) {
        Alert.alert('Introuvable', 'Aucune facture trouvée pour ce numéro.');
        return;
      }

      if (factures[0].etat !== 'payée') {
        Alert.alert('Non Conforme', 'Cette facture n\'est pas encore marquée comme payée.');
        return;
      }

      const profileRes = await getProfileByUid(uid);
      if (!profileRes) {
        Alert.alert('Erreur', 'Impossible de récupérer le profil du candidat.');
        return;
      }

      setProfile(profileRes);
      const likesRes = await LikeService.getLikesByfactNbre(factureNumber, postulers[0].id || '');
      setLikes(likesRes || []);
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération des données.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add new like
  const handleAddLike = async () => {
    if (!profile || !profile[0]) return;

    const nbrelikes = parseInt(likesToAdd, 10);
    if (isNaN(nbrelikes) || nbrelikes <= 0) {
      Alert.alert('Invalide', 'Veuillez entrer un nombre de likes valide.');
      return;
    }

    setAddLikeLoading(true);

    const newLike: Like = {
      uid: profile[0].uid,
      posteId: postuler[0].id || '',
      nbrelikes,
      factNbre: factureNumber,
    };

    try {
      await LikeService.createLike(newLike);
      Alert.alert('Succès', `${nbrelikes} like(s) ajoutés avec succès.`);
      handleFetch();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ajouter les likes.');
    } finally {
      setAddLikeLoading(false);
    }
  };

  // ✅ Delete like
  const handleDeleteLike = async (id: string) => {
    Alert.alert('Confirmation', 'Voulez-vous vraiment supprimer ce like ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await LikeService.deleteLike(id);
            Alert.alert('Supprimé', 'Le like a été supprimé.');
            setLikes((prev) => prev.filter((like) => like.id !== id));
          } catch {
            Alert.alert('Erreur', 'Échec de la suppression.');
          }
        },
      },
    ]);
  };

  // ✅ Update like
  const handleUpdateLike = async (id: string) => {
    const newValue = parseInt(editedLikes[id] || '', 10);
    if (isNaN(newValue) || newValue <= 0) {
      Alert.alert('Invalide', 'Veuillez entrer un nombre valide.');
      return;
    }

    try {
      await LikeService.updateLike(id, { nbrelikes: newValue });
      Alert.alert('Succès', 'Le like a été mis à jour.');
      setEditingLikeId(null);
      setEditedLikes((prev) => ({ ...prev, [id]: '' }));

      // update locally
      setLikes((prevLikes) =>
        prevLikes.map((like) =>
          like.id === id ? { ...like, nbrelikes: newValue } : like
        )
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le like.');
    }
  };

  const userProfile = profile?.[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={{marginVertical:20,marginHorizontal:10}}>
        <Header />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text style={styles.headerTitle}>Gestion des Likes</Text>

          {/* Vérification Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vérification du Candidat</Text>
            <Text style={styles.label}>Numéro du Candidat</Text>
            <TextInput
              value={numero}
              onChangeText={setNumero}
              style={styles.input}
              placeholder="Ex: 001"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Numéro de la Facture</Text>
            <TextInput
              value={factureNumber}
              onChangeText={setFactureNumber}
              style={styles.input}
              placeholder="Ex: FACT-00123"
            />
            <TouchableOpacity
              onPress={handleFetch}
              style={[styles.button, (loading || !numero || !factureNumber) && styles.buttonDisabled]}
              disabled={loading || !numero || !factureNumber}
            >
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Vérifier</Text>}
            </TouchableOpacity>
          </View>

          {/* Profil Section */}
          {userProfile && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Profil Trouvé</Text>

              <View style={styles.profileInfoContainer}>
                {userProfile.photos?.[0] ? (
                  <Image source={{ uri: userProfile.photos[0] }} style={styles.profileImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>{userProfile.fullName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.profileTextContainer}>
                  <Text style={styles.profileName}>{userProfile.fullName}</Text>
                  <Text style={styles.profileDetail}>Âge: {userProfile.age}  ·  Sexe: {userProfile.sex}</Text>
                </View>
              </View>

              <View style={styles.separator} />

              <Text style={styles.label}>Nombre de likes à ajouter</Text>
              <TextInput
                value={likesToAdd}
                onChangeText={setLikesToAdd}
                keyboardType="numeric"
                style={styles.input}
              />
              <TouchableOpacity onPress={handleAddLike} style={[styles.button, styles.addButton]} disabled={addLikeLoading}>
                {addLikeLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Ajouter les Likes</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Likes List */}
          {likes.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Likes Existants ({likes.reduce((acc, curr) => acc + curr.nbrelikes, 0)} total)</Text>
              {likes.map((item, index) => (
                <View key={item.id || index} style={styles.likeItem}>
                  {editingLikeId !== item.id ? (
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        value={editedLikes[item.id!] || item.nbrelikes.toString()}
                        onChangeText={(text) =>
                          setEditedLikes({ ...editedLikes, [item.id!]: text })
                        }
                        keyboardType="numeric"
                        style={[styles.input, { flex: 1, marginRight: 8 }]}
                      />
                      <TouchableOpacity
                        style={[styles.smallButton, { backgroundColor: COLORS.success, marginRight: 5 }]}
                        onPress={() => handleUpdateLike(item.id!)}
                      >
                        <Text style={styles.smallButtonText}>✔</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.smallButton, { backgroundColor: COLORS.danger }]}
                        onPress={() => handleDeleteLike(item.id!)}
                      >
                        <Text style={styles.smallButtonText}>✖</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View>
                        <Text style={styles.likeText}>
                          <Text style={{ fontWeight: 'bold' }}>{item.nbrelikes}</Text> like(s)
                        </Text>
                        <Text style={styles.likeDate}>ID: {item.id || 'N/A'}</Text>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.smallButton, { backgroundColor: COLORS.primary }]}
                          onPress={() => setEditingLikeId(item.id!)}
                        >
                          <Text style={styles.smallButtonText}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.smallButton, { backgroundColor: COLORS.danger }]}
                          onPress={() => handleDeleteLike(item.id!)}
                        >
                          <Text style={styles.smallButtonText}>Supprimer</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: { fontSize: 20, fontWeight: '600', color: COLORS.primary, marginBottom: 15 },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButton: { backgroundColor: COLORS.success },
  buttonDisabled: { backgroundColor: COLORS.disabled },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 20 },
  profileInfoContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: COLORS.background, borderRadius: 8 },
  profileImage: { width: 60, height: 60, borderRadius: 30, marginRight: 15, backgroundColor: '#E0E0E0' },
  placeholderImage: { width: 60, height: 60, borderRadius: 30, marginRight: 15, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: COLORS.white, fontSize: 24, fontWeight: 'bold' },
  profileTextContainer: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  profileDetail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  likeItem: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  likeText: { fontSize: 16, color: COLORS.text },
  likeDate: { fontSize: 12, color: COLORS.textSecondary },
  actionButtons: { flexDirection: 'row', gap: 8 },
  smallButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
});

export default GererLikeScreen;
