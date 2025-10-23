import { useAuth } from '@/contexts/AuthContext';
// Assuming deleteArticle exists, but not passed in the initial code.
import { articleCollection, deleteArticle, getArticlesByCategory } from "@/services/articleService";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, useTheme } from '@react-navigation/native'; // Import Theme type
import { router } from 'expo-router';
import { onSnapshot } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  ImageBackground,
  ListRenderItem,
  Modal,
  SafeAreaView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';

// ------------------------------------------------------------------
// 1. New Data for SearchableSelect
// ------------------------------------------------------------------
const DRCTowns: string[] = [
  "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kananga", "Kisangani", "Bukavu", "Kolwezi", "Goma",
  "Tshikapa", "Likasi", "Kikwit", "Uvira", "Bunia", "Butembo", "Mbandaka", "Matadi", "Bandundu",
  "Boma", "Kindu", "Isiro", "Gemena", "Kalemie", "Mwene-Ditu", "Kabinda", "Kamina", "Beni"
];

// ------------------------------------------------------------------
// 2. SearchableSelect Component (for Town filtering)
// ------------------------------------------------------------------
const { height } = Dimensions.get('window');

interface SearchableSelectProps {
  label: string;
  options: string[];
  onSelect: (value: string | null) => void;
  selectedValue: string | null;
  colors: Theme['colors'];
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, options, onSelect, selectedValue, colors }) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredOptions = useMemo((): string[] => {
    if (!searchQuery) {
      return options;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return options.filter(option =>
      option.toLowerCase().includes(lowerCaseQuery)
    );
  }, [options, searchQuery]);

  const handleSelect = useCallback((item: string) => {
    onSelect(item);
    setSearchQuery('');
    setModalVisible(false);
  }, [onSelect]);

  const handleClear = useCallback(() => {
    onSelect(null);
    setSearchQuery('');
    setModalVisible(false);
  }, [onSelect]);

  const renderItem: ListRenderItem<string> = ({ item }) => (
    <TouchableOpacity
      style={[localStyles.optionItem, { borderBottomColor: colors.border }]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[localStyles.optionText, { color: colors.text }]}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={localStyles.container}>
      {/* --- Display Component (The Input Field) --- */}
      <TouchableOpacity
        style={[localStyles.displayInput, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[localStyles.labelText, { color: colors.text, backgroundColor: colors.card }]}>{label}</Text>
        <View style={localStyles.selectedValueContainer}>
          <Text style={selectedValue ? localStyles.selectedValueText : localStyles.placeholderText}>
            {selectedValue || "Toutes les villes"}
          </Text>
          {selectedValue ? (
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleClear(); }}>
              <Ionicons name="close-circle" size={18} color={colors.primary} style={{marginLeft: 10}} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="caret-down-outline" size={18} color={colors.text} />
          )}
        </View>
      </TouchableOpacity>

      {/* --- Modal for Search and Selection --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={localStyles.modalOverlay}>
          <View style={[localStyles.modalContent, { backgroundColor: colors.background }]}>
            {/* Search Input */}
            <View style={[localStyles.searchContainer, { borderBottomColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.text} style={localStyles.searchIcon} />
              <TextInput
                style={[localStyles.searchInput, { color: colors.text }]}
                placeholder={`Rechercher ${label}...`}
                placeholderTextColor={colors.text + '99'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                {searchQuery ? <Ionicons name="close-circle" size={20} color={colors.text} /> : null}
              </TouchableOpacity>
            </View>

            {/* Clear Filter Option */}
             <TouchableOpacity
                style={[localStyles.optionItem, { borderBottomColor: colors.border, backgroundColor: selectedValue === null ? colors.border : 'transparent'}]}
                onPress={handleClear}
              >
                <Text style={[localStyles.optionText, { color: selectedValue === null ? colors.primary : colors.text, fontWeight: selectedValue === null ? 'bold' : 'normal' }]}>
                    Toutes les villes
                </Text>
              </TouchableOpacity>

            {/* List of Filtered Options */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item}
              renderItem={renderItem}
              ListEmptyComponent={<Text style={[localStyles.emptyList, { color: colors.text }]}>Aucune ville correspondante trouvée.</Text>}
            />

            {/* Close Button */}
            <TouchableOpacity
              style={[localStyles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={localStyles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// 3. Updated Article Type
// ------------------------------------------------------------------
export type Article = {
  id?: string;
  title: string;
  description: string;
  category: string;
  quantity?: string | null;
  images: string[];
  prix?: string | null;
  currency?: 'FC' | 'USD' | null;
  date?: string | null;
  style?: 'gospel' | 'mondaine' | null;
  sex?: 'Homme' | 'Femme' | null;
  transportType?: 'voiture' | 'moto' | null;
  town?: string | null; // <--- TOWN FIELD
  created_at: string;
  updated_at: string;
};
// ------------------------------------------------------------------


const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_MARGIN = 12;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;


const categories = [
  { name: 'Événements', icon: 'calendar' },
  { name: 'Shopping', icon: 'cart' },
  { name: 'Transport', icon: 'car' },
  { name: 'Réservation', icon: 'bed' },
  { name: 'Livraison', icon: 'bicycle' },
  { name: 'Rencontre', icon: 'heart' },
];



const ListePoste = () => {
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();
  const [data,setData] = useState<(any[])|null>([])
  const [allArticlesCache, setAllArticlesCache] = useState<Article[]>([]); // Cache for unfiltered data
  const [isLoading,setIsloading] = useState<boolean>(false)
  const spinAnim = useRef(new Animated.Value(0)).current;
  const { setItems,online,categorie } = useAuth();
  // --- New State for Town Filter ---
  const [selectedTown, setSelectedTown] = useState<string | null>(null);
  // -----------------------------------
  
  const spinning = () => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }
  
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // --- Client-Side Filter Function ---
  const filterArticlesByTown = useCallback((articles: Article[], town: string | null) => {
      if (!town) {
          return articles;
      }
      return articles.filter(article => article.town === town);
  }, []);
  // -----------------------------------

  // --- useEffect to load data from Firebase service ---
  useEffect(() => {
    spinning()
    const unsubscribe = onSnapshot(
      articleCollection,
      async () => {
        // Only fetch by category, without town, to keep the service function clean
        await fetchAndCacheArticles(categorie); 
      },
      (error) => {
        console.error("Error listening to articles:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [categorie])

  // --- useEffect to apply town filter when dependencies change ---
  useEffect(() => {
    // Apply the filter on the cached data whenever selectedTown or categorie changes
    const filteredData = filterArticlesByTown(allArticlesCache, selectedTown);
    setData(filteredData);
    setLoading(false);
  }, [allArticlesCache, selectedTown, categorie, filterArticlesByTown]);


  // --- Fetch articles function (only by category) ---
  const fetchAndCacheArticles= async (cat:string) => {
    setLoading(true);
    try {
      // FIX: Call getArticlesByCategory with the expected number of arguments (1)
      const allArticles = await getArticlesByCategory(cat); 
      setAllArticlesCache(allArticles || []); // Cache the unfiltered results
      
      // The filtering will happen in the subsequent useEffect
      return allArticles
    } catch (error) {
      console.error("Error fetching articles:", error);
      setLoading(false);
      return null
    }
  }
  // ----------------------------------------------------------

  const deleteArticleById = async (id: string, images: string[]) => {
    setIsloading(true)
    try {
      await deleteArticle(id, images);
      setIsloading(false)
      Alert.alert("Succès", "Article supprimé !");
    } catch (error) {
      setIsloading(false)
      Alert.alert("Erreur", "La suppression a échoué !");
    }
  }

  const navigateToUpdate = async ( item: (Article & {id:string}) ) => {
    try {
      await AsyncStorage.setItem('@article_to_update', JSON.stringify(item));
      router.push(`/UpdateArticle`);
    } catch (error) {
      console.error('Error saving article:', error);
    }
  }

  const isDatePast = (dateString: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    return date.getTime() < now.getTime();
  };

  const timeRemaining = (dateString: string): string => {
    const target = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff <= 0) return "Expiré";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) {
      return `${days} jour(s) restant(s)`;
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return `${hours} heure(s) restante(s)`;
    }
  };

  const timeDiff = (dateString: string): string => {
    const target = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return `${days} jour(s) restant(s)`;
    } else {
      const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
      return `${hours} heure(s) passé(es)`;
    }
  };

  const goToDetails = (item: (Article & {id:string})) => {
    setItems(item);
    router.push('/ViewDetails');
  }


  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="sync" size={40} color={colors.primary} />
        </Animated.View>
        <Text style={{color: colors.text, marginTop: 10}}>Chargement...</Text>
      </View>
    );
  }


  const renderCard = ({ item }: { item: (Article & {id:string}) }) => {
    return (
      <TouchableOpacity key={item.id} style={[styles.cardWrapper, {backgroundColor: colors.card}]}
        activeOpacity={0.8}
        onPress={() => goToDetails(item)}
      >
        <ImageBackground
          source={{ uri: item.images[0] }}
          style={styles.image}
          imageStyle={styles.imageStyle}
        >
          {item.prix && (
            // FIX: Removed glassmorphic style (backgroundColor: "rgba(0,0,0,0.6)")
            <View style={[styles.priceBadge,{flexDirection:'row',alignItems:'center', backgroundColor: colors.primary}]}> 
              <Text style={styles.priceText}>
                {item.currency === "USD" ? "$" : "FC"} {item.prix} {["Transport", "Livraison"].includes(item.category) ? "/Km" : ""} {item.category === "Réservation" ? "/Jour" : ""}
                {item.category === "Événements" ? "/Ticket" : ""} {item.category === "Shopping" ? "/Article" : ""}
              </Text>
              
            </View>
          )}
          { item.category === "Événements" && item.date && 
            <Text style={{ position: 'absolute', bottom:5, left: 10, backgroundColor: colors.card, borderRadius: 15, padding: 5, color: colors.text }}>
              {isDatePast(item.date) ? timeDiff(item.date) : timeRemaining(item.date)}
            </Text>
          }
          {["Transport", "Livraison"].includes(item.category) && 
            <View style={[{position: 'absolute', bottom:1, right: 2, backgroundColor: colors.card, borderRadius: 15, padding: 5}]}>
              <Text style={{color:colors.text,fontWeight:'700',fontSize:12}}>
                {online ? "🟢 enligne" : "🔴 Horsline"}
              </Text>
            </View>}
        </ImageBackground>

        {/* category Icon */}
        <Ionicons
          name={categories.find(cat => cat.name === item.category)?.icon || 'pricetag' as any}
          size={22}
          color={colors.primary}
          style={{ position: 'absolute', top: 9, left: 10, backgroundColor: colors.card, borderRadius: 15, padding: 5 }}
        />

        <View style={[styles.cardBody]}>
          
          <Text numberOfLines={1} style={[styles.title, {color: colors.text}]}>
            {item.category === "Transport" ? `Taxi ${item.transportType}` : item.title}
          </Text>

          {/* Display Town below the title */}
          {item.town && (
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                <Ionicons name="location" size={12} color={colors.primary} />
                <Text style={{fontSize: 10, color: colors.text, marginLeft: 4, fontWeight: 'bold'}}>{item.town}</Text>
            </View>
          )}
          {/* ----------------------------- */}

          <Text numberOfLines={2} style={[styles.description, {color: colors.text}]}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  
  return (
    <View style={{ flex: 1,paddingTop:28 ,backgroundColor: colors.background }}>

      {/* Town filter component */}
      <View style={{paddingHorizontal: CARD_MARGIN, marginBottom: 10}}>
        <SearchableSelect
          label="Filtrer par ville"
          options={DRCTowns}
          onSelect={setSelectedTown}
          selectedValue={selectedTown}
          colors={colors}
        />
      </View>


      {/* Liste */}
      {(!data || data.length === 0) ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center",paddingHorizontal:10 }}>
          <Text style={{ color: colors.text }}>
             {selectedTown ? `Aucun article trouvé pour ${selectedTown} dans cette catégorie.` : "Aucun article trouvé dans cette catégorie."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i, idx) => i.id ?? idx.toString()}
          renderItem={renderCard}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={true}
        />
      )}
    </View>
  );

}

// ------------------------------------------------------------------
// 4. Combined Styles (Including localStyles for SearchableSelect)
// ------------------------------------------------------------------
const localStyles = StyleSheet.create({
  container: {
    // Matches the spacing of other components
  },
  // --- Display Input Styles ---
  displayInput: {
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
  },
  labelText: {
    position: 'absolute',
    top: -10,
    left: 10,
    paddingHorizontal: 4,
    fontSize: 12,
    zIndex: 10,
    fontWeight: '600',
  },
  selectedValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedValueText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
    flex: 1,
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    maxHeight: height * 0.7,
    padding: 20,
  },
  // --- Search Input Styles ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  // --- List Styles ---
  optionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  emptyList: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  // --- Close Button Styles ---
  closeButton: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent:'space-between',marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', marginLeft: 8 },
  
  listContainer: {
    paddingHorizontal: CARD_MARGIN,
    paddingBottom: 24,
  },
  column: {
    justifyContent: "space-between",
    marginBottom: CARD_MARGIN,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  image: {
    width: "100%",
    height: CARD_WIDTH * 0.65,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  imageStyle: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  // FIX: Updated style
  priceBadge: {
    // Removed transparency for "glassmorphism"
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    margin: 8,
  },
  priceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  cardBody: {
    padding: 15,
    minHeight: 86,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
  },
})

export default ListePoste