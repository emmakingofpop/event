import { useAuth } from '@/contexts/AuthContext';
import { getArticlesByCategory } from '@/services/articleService';
import { FactureService } from '@/services/FactureService';
import { LikeService } from '@/services/likeService';
import { PostulerService } from '@/services/postulerService';
import { getProfilesByUids } from '@/services/profileService';
import { tel } from '@/type/type';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from './components/header';

const { width } = Dimensions.get('window');

const VoteScreen = () => {
  const [typeselected, setTypeSelected] = useState<string>('');
  const [souscategorie, setSouscategorie] = useState<string>('');
  const [datas, setData] = useState<any[]>([]);
  const [id, setId] = useState<string>('');
  const [isLoading, setIsloading] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});

  const { colors } = useTheme();
  const { user } = useAuth();

  const souscat = ['sous cat 1', 'sous cat 2', 'sous cat 3', 'sous cat 4', 'sous cat 5'];

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
      } catch (error) {
        
      }
    };
    getArticlesByCategori();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load profiles and merge numéro, with category filter
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const getAllPostulersWithEventIds = async (eventId: string) => {
      try {
        let postulers = await PostulerService.getAllPostulersWithEventId(eventId);

        // Filter by category if ballon d'or
        if (typeselected === "ballon d'or" && postulers && postulers.length > 0 && souscategorie) {
          postulers = postulers.filter((p: any) => p.category === souscategorie);
        }

        if (!isMounted) return;

        if (postulers?.length > 0) {
          const uids = postulers.map((p: any) => p.uid);
          let profilesData = await getProfilesByUids(uids);
          if (!isMounted) return;

          const merged = profilesData.map((profile: any) => {
            const match = postulers.find((p: any) => p.uid === profile.uid);
            return { ...profile, numero: match?.numero || '', posteId: match?.id || '' };
          });

          setProfiles(merged);

          // Fetch initial likes counts
          const likes: Record<string, number> = {};
          await Promise.all(
            merged.map(async (p) => {
              likes[p.posteId] = await LikeService.getLikesCount(p.posteId);
            })
          );
          setLikesMap(likes);
        } else {
          setProfiles([]);
        }
      } catch (error) {
        
      }
    };

    getAllPostulersWithEventIds(id);

    return () => {
      isMounted = false;
    };
  }, [id, souscategorie, typeselected]);
    
  // Handlers
  const handleWhatsApp = (phone: string, message: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/\s+/g, '');
    const formatted = cleaned.startsWith('0') ? `243${cleaned.slice(1)}` : cleaned;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message || '');

    const url = `https://wa.me/${formatted}?text=${encodedMessage}`;
    Linking.openURL(url).catch(() => console.error('Cannot open WhatsApp'));
  };

  // 

  const handlePayLike = async (selectedProfile:any) => {
    
      try {
        setIsloading(true)
        const desc = `Concour ${typeselected} / ${souscategorie || ''} Candidat N*: ${selectedProfile?.numero || ''}`
        const id = await FactureService.createFacture({
          uid: user?.uid,
          etat: "en attente",
          posteId:selectedProfile?.posteId || '',
          scanned:false,
          items: [
            { id: "1", nom: desc, quantite: 0, prix: 0 },
          ],
        });

        if (id) {
          handleWhatsApp(
              tel,
              `Bonjour, je souhaite effectuer l'achat de likes pour le candidat ${selectedProfile.numero}, 
            par la facture numéro : ${id}. Merci !`
            );

            setIsloading(false)
        }

      } catch {
            setIsloading(false)
      }
  }

const handleLike = async (item: any) => {
  if (!user) return;

  try {
    const result = await LikeService.toggleLike(user.uid, item.posteId);

    // Mets à jour le compteur avec le nbrelikes retourné par Firestore
    setLikesMap((prev) => ({
      ...prev,
      [item.posteId]: result.nbrelikes,
    }));
  } catch (error) {
    console.error("Like error:", error);
  }
};


  const openProfileModal = (profile: any) => {
    setSelectedProfile(profile);
    setModalVisible(true);
  };

  const renderProfileCard = ({ item }: { item: any }) => {
    const mainPhoto = item?.photos?.[0] ?? null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openProfileModal(item)}
        activeOpacity={0.8}
      >
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
              style={[styles.btn, styles.likeBtn]}
              onPress={() => handleLike(item)}
            >
              <Ionicons name="heart" size={18} color="#fff" />
              <Text style={styles.btnText}> Like ({likesMap[item.posteId] || 0})</Text>
            </TouchableOpacity>
            
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <Text style={[styles.title, { color: colors.text }]}>Voter</Text>

      {/* Type picker */}
      <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
        <Picker
          selectedValue={typeselected}
          onValueChange={(itemValue) => {
            const [style, idx] = itemValue.split('|');
            setTypeSelected(style);
            setId(idx);
            setSouscategorie('');
          }}
          style={styles.picker}
          dropdownIconColor="#fff"
        >
          <Picker.Item label="Sélectionnez le type" value="" />
          {datas.map((cat, idx) => (
            <Picker.Item
              key={idx}
              label={cat.title}
              value={`${cat.style}|${cat.id}`}
            />
          ))}
        </Picker>
      </View>

      {/* Category picker only for ballon d'or */}
      {typeselected === "ballon d'or" && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Choisissez la catégorie :</Text>
          <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
            <Picker
              selectedValue={souscategorie}
              onValueChange={(itemValue) => setSouscategorie(itemValue)}
              style={styles.picker}
              dropdownIconColor="#fff"
            >
              <Picker.Item label="Sélectionnez" value="" />
              {souscat.map((cat, idx) => (
                <Picker.Item key={idx} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Profiles list */}
      <FlatList
        data={profiles}
        numColumns={2}
        keyExtractor={(item, idx) => item?.id ?? idx.toString()}
        renderItem={renderProfileCard}
        columnWrapperStyle={styles.cardRow}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun profil trouvé.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
        removeClippedSubviews
        windowSize={5}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {selectedProfile && (
                <>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                  >
                    {selectedProfile.photos?.slice(0, 10).map((photo: string, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri: photo }}
                        style={styles.modalImage}
                      />
                    ))}
                  </ScrollView>
                  <View style={styles.modalDetails}>
                    <Text style={styles.modalName}>{selectedProfile.fullName}</Text>
                    <Text style={styles.modalAge}>{selectedProfile.age} ans</Text>
                    {selectedProfile.numero && (
                      <Text style={styles.modalNumero}>Numéro du candidat : {selectedProfile.numero}</Text>
                    )}
                    <Text style={styles.modalDescription}>
                      {selectedProfile.description || 'Aucune description.'}
                    </Text>
                    <View style={styles.modalButtons}>

                      <TouchableOpacity
                        style={[styles.btn, styles.likeBtn]}
                        onPress={() => handleLike(selectedProfile)}
                      >
                        <Ionicons name="heart" size={18} color="#fff" />
                        <Text style={styles.btnText}>
                          Like ({likesMap[selectedProfile.posteId] || 0})
                        </Text>
                      </TouchableOpacity>

                      {/* Bouton "Payer pour liker" */}
                      <TouchableOpacity
                        style={[styles.btn, styles.payBtn]}
                        onPress={() => handlePayLike(selectedProfile)}
                        disabled={isLoading}
                      >
                        <Ionicons name="card" size={18} color="#fff" />
                        <Text style={styles.btnText}>{isLoading?'chargement...':'Payer les likes 💳'}</Text>
                      </TouchableOpacity>

                    </View>
                  </View>
                </>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={26} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 20, backgroundColor: '#f6f6f6' },
  pickerWrapper: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  picker: { height: 50, color: '#032D23' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 18, textAlign: 'center', letterSpacing: 1 },
  label: { fontSize: 16, fontWeight: '600', marginHorizontal: 5 },
  cardRow: { justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 20, flex: 0.48, overflow: 'hidden' },
  cardImage: { width: '100%', height: 150 },
  cardContent: { padding: 10 },
  cardName: { fontWeight: '700', fontSize: 16 },
  cardAge: { color: '#888', marginVertical: 4 },
  cardNumero: { fontSize: 14, fontWeight: '600', color: '#032D23', marginBottom: 5 },
  cardNumeroDisabled: { fontSize: 13, color: '#aaa', fontStyle: 'italic', marginBottom: 5 },
  cardButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', borderRadius: 25, paddingVertical: 6, paddingHorizontal: 14 },
  likeBtn: { backgroundColor: '#ff4757' },
  whatsappBtn: { backgroundColor: '#25D366' },
  btnText: { color: '#fff', fontWeight: '600', marginLeft: 5 },
  emptyText: { textAlign: 'center', color: '#777', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden', maxHeight: '85%' },
  modalImage: { width: width - 40, height: 300, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  modalDetails: { padding: 15 },
  modalName: { fontSize: 20, fontWeight: '700' },
  modalAge: { color: '#777', marginBottom: 8 },
  modalNumero: { color: '#032D23', fontWeight: '600', marginBottom: 8 },
  modalDescription: { fontSize: 15, color: '#444', marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  closeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', borderRadius: 20, padding: 6 },
  payBtn: {
    backgroundColor: "#0077b6",
  },

});

export default VoteScreen;
