import { useAuth } from '@/contexts/AuthContext';
import { getArticlesLimit } from '@/services/articleService';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../components/header';

// Get the full width of the screen for the modal images
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, setCat } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const categories = [
    { name: 'Événements', icon: 'calendar' },
    { name: 'Shopping', icon: 'cart' },
    { name: 'Transport', icon: 'car' },
    { name: 'Réservation', icon: 'bed' },
    { name: 'Livraison', icon: 'bicycle' },
    { name: 'Rencontre', icon: 'heart' },
  ];

  const setrouter = (cat: string) => {
    setCat(cat);
    router.push('/ListePoste');
  };

  useEffect(() => {
    getAllArticles();
  }, [user]);

  const getAllArticles = async () => {
    try {
      setLoading(true);
      const res = await getArticlesLimit();
      if (res) {
        setData(res);
        setFilteredData(res);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const newData = data.filter((item) => {
        const itemData = item.title ? item.title.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredData(newData);
    } else {
      setFilteredData(data);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {/* Header, Search, Buttons, and Categories remain the same */}
      <Header />
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          placeholder="Rechercher..."
          placeholderTextColor={`gray`}
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <Ionicons name="search" size={22} color={colors.primary} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/VoteScreen')}
        >
          <Text style={{ color: '#fff' }}>Voter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/MusiqueScreen')}
        >
          <Text style={{ color: '#fff' }}>Import Musiques</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/AgentscanScreen')}
        >
          <Text style={{ color: '#fff' }}>Agent Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/QrCodeScanScreen')}
        >
          <Text style={{ color: '#fff' }}>Qr Code Scan</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.categories}>
        {categories.map((cat, index) => (
          <TouchableOpacity key={index} style={[styles.categoryButton, { backgroundColor: colors.card }]} onPress={() => setrouter(cat.name)}>
            <Ionicons name={cat.icon as any} size={24} color={colors.primary} />
            <Text style={{ fontSize: 12, color: colors.text, marginTop: 4 }}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section Produits / Services */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>À découvrir</Text>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {filteredData.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {filteredData.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => setSelectedItem(item)}
                    >
                      <View style={{ position: 'relative' }}>
                        <Image
                          source={{ uri: item.images?.[0] }}
                          style={{ width: 170, height: 120, borderRadius: 16 }}
                        />
                        {/* Overlay text */}
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          borderBottomLeftRadius: 16,
                          borderBottomRightRadius: 16,
                          padding: 6,
                        }}>
                          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
                            {item.title || 'Sans titre'}
                          </Text>
                          <Text style={{ color: '#ffd700', fontWeight: '600', fontSize: 12 }} numberOfLines={1}>
                            {item.prix ? `${item.prix} ${item.currency || ''}` : 'Prix non spécifié'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={[styles.noResultsText, { color: colors.text }]}>
                  Aucun résultat trouvé pour {searchQuery}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* --- NEW MODAL STRUCTURE --- */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent,]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  {/* Horizontal Image Slider */}
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={styles.modalImageContainer}
                  >
                    {selectedItem.images?.length > 0 ? (
                      selectedItem.images.map((photo: string, idx: number) => (
                        <Image key={idx} source={{ uri: photo }} style={styles.modalImage} />
                      ))
                    ) : (
                      // Fallback if there are no images
                      <View style={styles.modalImagePlaceholder}>
                        <Ionicons name="image-outline" size={80} color={colors.border} />
                      </View>
                    )}
                  </ScrollView>

                  {/* Details Section */}
                  <View style={styles.modalDetails}>
                    <Text style={[styles.modalName, { color: colors.text }]}>{selectedItem.title}</Text>
                    <Text style={[styles.modalPriceText, { color: colors.primary }]}>
                      {selectedItem.prix ? `${selectedItem.prix} ${selectedItem.currency || ''}` : 'Prix non spécifié'}
                    </Text>
                    <Text style={[styles.modalDescription, { color: colors.text }]}>
                      {selectedItem.description || 'Aucune description.'}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
              <Ionicons name="close-circle" size={32} color={colors.text} />
              
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* --- END NEW MODAL STRUCTURE --- */}
    </ScrollView>
  );
}

// --- UPDATED STYLES FOR NEW MODAL ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 20, paddingBottom: 70},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    height: 50,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 16 },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 10,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryButton: {
    width: '30%',
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { borderRadius: 20, marginRight: 16, padding: 12, borderWidth: 1, alignItems: 'center', width: 195 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  cardPrice: { fontSize: 14, marginTop: 4 },
  noResultsContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // New Modal Styles
 
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
  modalImageContainer: {
    height: 300, // Fixed height for the image slider part
  },

  modalImagePlaceholder: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },

  modalPriceText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },

});