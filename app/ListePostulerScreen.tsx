import { useAuth } from '@/contexts/AuthContext';
import { getArticlesByCategory } from '@/services/articleService';
import { LikeService } from '@/services/likeService';
import { PostulerService } from '@/services/postulerService';
import { deleteProfile, getProfilesByUids } from '@/services/profileService';
import { souscat } from '@/type/type';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Header from './components/header';

const { width } = Dimensions.get('window');

const ListePostulerScreen = () => {
  const [typeselected, setTypeSelected] = useState<string>('');
  const [souscategorie, setSouscategorie] = useState<string>('');
  const [datas, setData] = useState<any[]>([]);
  const [id, setId] = useState<string>('');
  const [isLoading, setIsloading] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { colors } = useTheme();
  const { user } = useAuth();

  // Animate fade-in
  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // Load event categories
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await getArticlesByCategory('Événements');
        if (!mounted) return;
        const filtered = res.filter(
          (cat: any) => cat.style === 'concour miss' || cat.style === "ballon d'or"
        );
        setData(filtered);
      } catch {
        Alert.alert('Erreur', 'Impossible de charger les catégories');
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Delete and reload
  const deleteProfiles = async (uid: string, images: string[]) => {
    try {
      setIsDeleting(uid);
      const post = await PostulerService.getPostulersByUid(uid);
      if (!post?.length) {
        Alert.alert('Erreur', 'Candidat introuvable.');
        setIsDeleting(null);
        return;
      }

      const deletedPost = await PostulerService.deletePostuler(post[0]?.id || '');
      if (!deletedPost) throw new Error();

      const deletedProfile = await deleteProfile(uid, images);
      if (!deletedProfile) throw new Error();

      Alert.alert('Succès', 'Suppression effectuée ✅');

      // Reload smooth
      await reloadProfiles();
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
    } finally {
      setIsDeleting(null);
    }
  };

  // Fetch postulers
  const reloadProfiles = async () => {
    if (!id) return;
    try {
      setIsloading(true);
      let postulers = await PostulerService.getAllPostulersWithEventId(id);
      if (typeselected === "ballon d'or" && souscategorie) {
        postulers = postulers.filter((p: any) => p.category === souscategorie);
      }
      if (!postulers.length) {
        setProfiles([]);
        setIsloading(false);
        return;
      }
      const uids = postulers.map((p: any) => p.uid);
      const profilesData = await getProfilesByUids(uids);

      const merged = profilesData.map((profile: any) => {
        const match = postulers.find((p: any) => p.uid === profile.uid);
        return { ...profile, numero: match?.numero || '', posteId: match?.id || '' };
      });

      setProfiles(merged);

      // Fetch likes
      const likes: Record<string, number> = {};
      await Promise.all(
        merged.map(async (p) => {
          likes[p.posteId] = await LikeService.getLikesCount(p.posteId);
        })
      );
      setLikesMap(likes);
      fadeIn();
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les candidats');
    } finally {
      setIsloading(false);
    }
  };

  // Auto-load when selection changes
  useEffect(() => {
    reloadProfiles();
  }, [id, souscategorie, typeselected]);

  // Render each profile card
  const renderProfileCard = ({ item }: { item: any }) => {
    const mainPhoto = item?.images?.[0] ?? null;
    const deleting = isDeleting === item.uid;

    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        {mainPhoto && <Image source={{ uri: mainPhoto }} style={styles.cardImage} />}
        <View style={styles.cardContent}>
          <Text style={styles.cardName}>{item.fullName}</Text>
          <Text style={styles.cardAge}>{item.age} ans</Text>
          {item.numero ? (
            <Text style={styles.cardNumero}>N° Candidat : {item.numero}</Text>
          ) : (
            <Text style={styles.cardNumeroDisabled}>Numéro non disponible</Text>
          )}
          <View style={styles.cardButtons}>
            <TouchableOpacity
              style={[styles.btn, styles.deleteBtn]}
              onPress={() => deleteProfiles(item.uid, item.images)}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Supprimer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <Text style={[styles.title, { color: colors.text }]}>Liste Des Candidats</Text>

      {/* Type picker */}
      <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
        <Picker
          selectedValue={typeselected}
          onValueChange={(value) => {
            const [style, idx] = value.split('|');
            setTypeSelected(style);
            setId(idx);
            setSouscategorie('');
          }}
          style={styles.picker}
          dropdownIconColor="#032D23"
        >
          <Picker.Item label="Sélectionnez le type" value="" />
          {datas.map((cat, idx) => (
            <Picker.Item key={idx} label={cat.title} value={`${cat.style}|${cat.id}`} />
          ))}
        </Picker>
      </View>

      {/* Sous-catégorie (ballon d'or only) */}
      {typeselected === "ballon d'or" && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Choisissez la catégorie :</Text>
          <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
            <Picker
              selectedValue={souscategorie}
              onValueChange={(v) => setSouscategorie(v)}
              style={styles.picker}
              dropdownIconColor="#032D23"
            >
              <Picker.Item label="Sélectionnez" value="" />
              {souscat.map((cat, idx) => (
                <Picker.Item key={idx} label={cat.title} value={cat.title} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Profiles */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#0077b6'} />
          <Text style={styles.loadingText}>Chargement des candidats...</Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          numColumns={2}
          keyExtractor={(item, idx) => item?.id ?? idx.toString()}
          renderItem={renderProfileCard}
          columnWrapperStyle={styles.cardRow}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun profil trouvé.</Text>}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshing={isLoading}
          onRefresh={reloadProfiles}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fc' },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  picker: { height: 50, color: '#032D23' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  label: { fontSize: 16, fontWeight: '600', marginHorizontal: 5 },
  cardRow: { justifyContent: 'space-between' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 18,
    flex: 0.48,
    overflow: 'hidden',
    transform: [{ scale: 1 }],
  },
  cardImage: { width: '100%', height: 150 },
  cardContent: { padding: 10 },
  cardName: { fontWeight: '700', fontSize: 16 },
  cardAge: { color: '#666', marginVertical: 3 },
  cardNumero: { fontSize: 14, fontWeight: '600', color: '#032D23' },
  cardNumeroDisabled: { fontSize: 13, color: '#aaa', fontStyle: 'italic' },
  cardButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  deleteBtn: { backgroundColor: '#e63946' },
  btnText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#777', marginTop: 40 },
  loaderContainer: { marginTop: 60, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#555', fontSize: 16 },
});

export default ListePostulerScreen;
