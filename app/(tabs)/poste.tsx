import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from "@react-native-picker/picker";
import { Theme, useTheme } from '@react-navigation/native'; // Import Theme type
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  ListRenderItem,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createArticle } from "../../services/articleService";

import { useAuth } from '@/contexts/AuthContext';
import { getUserAbonnements } from '@/services/AbonnementServices';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/header';

const { height } = Dimensions.get('window');

// ------------------------------------------------------------------
// 1. New Data for SearchableSelect
// ------------------------------------------------------------------
const DRCTowns: string[] = [
  "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kananga", "Kisangani", "Bukavu", "Kolwezi", "Goma",
  "Tshikapa", "Likasi", "Kikwit", "Uvira", "Bunia", "Butembo", "Mbandaka", "Matadi", "Bandundu",
  "Boma", "Kindu", "Isiro", "Gemena", "Kalemie", "Mwene-Ditu", "Kabinda", "Kamina", "Beni"
];

// ------------------------------------------------------------------
// 2. SearchableSelect Component Types
// ------------------------------------------------------------------
interface SearchableSelectProps {
  label: string;
  options: string[];
  onSelect: (value: string) => void;
  selectedValue: string | null;
  colors: Theme['colors'];
}

// ------------------------------------------------------------------
// 3. SearchableSelect Component
// ------------------------------------------------------------------
const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, options, onSelect, selectedValue, colors }) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtering Logic
  const filteredOptions = useMemo((): string[] => {
    if (!searchQuery) {
      return options;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return options.filter(option =>
      option.toLowerCase().includes(lowerCaseQuery)
    );
  }, [options, searchQuery]);

  // Handle Item Selection
  const handleSelect = useCallback((item: string) => {
    onSelect(item);
    setSearchQuery('');
    setModalVisible(false);
  }, [onSelect]);

  // Render function for FlatList items (Typed)
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
            {selectedValue || "Sélectionner une ville..."}
          </Text>
          <Ionicons name="caret-down-outline" size={18} color={colors.text} />
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
                placeholderTextColor={colors.text + '99'} // Use a slight opacity on text color
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                {searchQuery ? <Ionicons name="close-circle" size={20} color={colors.text} /> : null}
              </TouchableOpacity>
            </View>

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
// 4. Main Poste Component
// ------------------------------------------------------------------

export type Article = {
  id?: string; // optionnel, Firestore le génère
  uid:string; // ID de l'utilisateur qui crée l'article
  title: string;
  description: string;
  category: string; // par exemple: 'Événements', 'Transport', etc.
  quantity?: string | null; // peut être vide selon catégorie
  images: string[]; // URLs des images uploadées
  // Removed 'ville' field as it was redundant with 'town'
  prix?: string | null;
  currency?: 'FC' | 'USD' | null;
  date?: string | null; // ISO string si catégorie = Événements
  style?: 'gospel' | 'mondaine' | "ballon d'or" | "concour miss" | null; // si catégorie = Événements
  sex?: 'Homme' | 'Femme' | null;
  transportType?: 'voiture' | 'moto' | null; // si catégorie = Transport
  town?: string | null; // <--- The correct field for the selected town
  created_at: string; // ISO string
  updated_at: string; // ISO string
};

const categories = [
  { name: 'Événements', icon: 'calendar' },
  { name: 'Shopping', icon: 'cart' },
  { name: 'Transport', icon: 'car' },
  { name: 'Réservation', icon: 'bed' },
  { name: 'Livraison', icon: 'bicycle' },
  { name: 'Rencontre', icon: 'heart' },
];

export default function Poste() {
  const [date, setDate] = useState<Date>(new Date());
  const [show, setShow] = useState<boolean>(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [typeselected, setTypeSelected] = useState<"gospel" | "mondaine" | "ballon d'or" | "concour miss">("gospel");
  const [sex, setSex] = useState<"Homme" | "Femme">("Homme");
  const [selected, setSelected] = useState<"voiture" | "moto" | null>(null);
  const [prix, setPrix] = useState<string>('');
  const [currency, setCurrency] = useState<'FC' | 'USD'>('FC');
  const [isLoading,setIsloading] = useState<boolean>(false)
  const [userAbos, setUserAbos] = useState<any[]>([]);
  const [loadingAbos, setLoadingAbos] = useState<boolean>(true);
  const { colors } = useTheme();
  const { user } = useAuth();
  const spinAnim = useRef(new Animated.Value(0)).current;

  // State for SearchableSelect (Typed)
  const [selectedTown, setSelectedTown] = useState<string | null>(null);


  useEffect(() => {
      spinning()
  }, []);
  
  useEffect(() => {
    if (user?.uid) fetchAbonnements();
  }, [user?.uid]);

  const fetchAbonnements = async () => { 
    try {
      setLoadingAbos(true)
      const data = await getUserAbonnements(user!.uid);
      setUserAbos(data);
    } catch (err) {
      console.error("Erreur abonnements:", err);
    } finally {
      setLoadingAbos(false);
    }
  };

  const isCategoryAvailable = (category: string): boolean => { 
    const abo = userAbos.find((a) => a.category === category);
    if (!abo) return false;
    const daysLeft =
      (new Date(abo.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24);
    return abo.active && daysLeft > 0;
  };


  const spinning = () => { 
      Animated.loop(
        Animated.timing(spinAnim,
{
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

  const pickImages = async () => { 
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      // Ensure result.assets is treated as an array of objects with a 'uri' property
      const uris = result.assets.map((a: { uri: string }) => a.uri);
      setImages([...images, ...uris]);
    }
  };

    const showMode = (currentMode: 'date' | 'time') => { 
    setShow(true);
    setMode(currentMode);
  };
  
  const onChange = (event: any, selectedDate?: Date) => { 
    setShow(Platform.OS === 'ios'); // iOS keeps picker open
    if (selectedDate) setDate(selectedDate);
  };

  const addArticle = async (article:Article) => { 
    try {
      const newArticle = await createArticle(article);
      return newArticle
    } catch (error) {
      console.error("Error creating article:", error);
      return null
    }
  }

  const handlePublish = async () => {
    if (!selectedCategory) {
      Alert.alert("Erreur", "Veuillez choisir une catégorie.");
      return;
    }
    
    // --- Town Validation ---
    if (!selectedTown) {
        Alert.alert("Erreur", "Veuillez sélectionner une ville.");
        return;
    }
    // ----------------------

    // Vérification spécifique selon la catégorie
    if (selectedCategory !== "Transport" && selectedCategory !== "Rencontre" && !title) {
      Alert.alert("Erreur", "Veuillez entrer un titre.");
      return;
    }

    if (!description) {
      Alert.alert("Erreur", "Veuillez entrer une description.");
      return;
    }

    if (selectedCategory !== "Rencontre" && images.length === 0) {
      Alert.alert("Erreur", "Veuillez ajouter au moins une photo.");
      return;
    }

    if (
      selectedCategory !== "Transport" &&
      selectedCategory !== "Réservation" &&
      selectedCategory !== "Livraison" &&
      selectedCategory !== "Rencontre" &&
      !quantity
    ) {
      Alert.alert("Erreur", "Veuillez indiquer la quantité.");
      return;
    }

    if (selectedCategory !== "Rencontre" && !prix) {
      Alert.alert("Erreur", "Veuillez indiquer un prix.");
      return;
    }

    if (selectedCategory === "Transport" && !selected) {
      Alert.alert("Erreur", "Veuillez choisir un type de transport.");
      return;
    }

    const now = new Date().toISOString(); 

    // Objet final à envoyer
    const article: Article = {
      uid: user?.uid || "anonymous",
      title,
      description,
      category: selectedCategory!,
      quantity: quantity || null,
      images,
      prix: prix || null,
      currency: currency || null,
      date: selectedCategory === "Événements" ? date.toISOString() : null,
      style: selectedCategory === "Événements" ? typeselected : null,
      sex: selectedCategory === "Rencontre" ? sex : null,
      transportType: selectedCategory === "Transport" ? selected : null,
      town: selectedTown, // <-- Correctly uses the state from the parent component
      created_at: now,
      updated_at: now,
    };

    setIsloading(true)
    const newArticle = await addArticle(article)

    if (newArticle) {
      setIsloading(false)
      setInputToDefault()
      Alert.alert("Succès", "Article ajouté avec succès !");
      router.push("/liste");
    } else {
      setIsloading(false)
        Alert.alert("Erreur", "Échec de l'ajout de l'article. Veuillez réessayer !");
    }
    
  };

  const setInputToDefault = () => {
    setTitle("");
    setDescription("");
    setSelectedCategory(null);
    setQuantity("");
    setImages([]);
    setPrix("");
    setCurrency("FC");
    setDate(new Date());
    setTypeSelected("gospel");
    setSex("Homme");
    setSelected(null);
    setSelectedTown(null); // Reset town
  }


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >

        <View style={styles.container}>
          <Header />
          <ScrollView 
            showsVerticalScrollIndicator={false}
            style={[styles.card,{paddingBottom: 70,maxHeight:'70%',}]}
            keyboardShouldPersistTaps="handled"
            >
            
            <View style={{flexDirection:'row',justifyContent:'space-around'}}>
                
 
              <Text style={[styles.title,{color:colors.text}]}>Nouvel Article</Text>

              <TouchableOpacity
onPress={()=>{
                if (user?.uid) fetchAbonnements();
              }}>
                <Ionicons name="refresh" size={24} color={colors.primary} />
              </TouchableOpacity>

            </View>
            
            {/* Sélection de la catégorie */}
            { selectedCategory !== "Transport" && 
            <TextInput
              style={[styles.input,{color:colors.text,borderColor: colors.border,}]}
              placeholder={selectedCategory ==="Rencontre" ? "Nom complet" : "Titre de l'article"}
              placeholderTextColor="#ccc"
              value={title}
              onChangeText={setTitle}
            />}

            {/* --- SearchableSelect for Town --- */}
            <SearchableSelect
              label="Sélectionner une ville"
              options={DRCTowns}
              onSelect={setSelectedTown}
              selectedValue={selectedTown}
              colors={colors} // Pass theme colors for styling
            />

            {/* selection du type de transport */}
            { selectedCategory === "Transport" && 
            <View style={styles.container}>
              <Text style={[styles.label, {color: colors.text}]}>Sélectionnez votre type de transport :</Text>

              {/* Option voiture */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => setSelected("voiture")}
              >
                <Ionicons
                  name={selected === "voiture" ? "radio-button-on" : "radio-button-off"}
                  size={24}
                  color={selected === "voiture" ? colors.primary : "#555"}
                />
                <Text style={[styles.text, {color: colors.text}]}>Voiture</Text>
              </TouchableOpacity>

              {/* Option moto */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => setSelected("moto")}
              >
                <Ionicons
                  name={selected === "moto" ? "radio-button-on" : "radio-button-off"}
                  size={24}
                  color={selected === "moto" ? colors.primary : "#555"}
                />
                <Text style={[styles.text, {color: colors.text}]}>Moto</Text>
              </TouchableOpacity>

            </View>}

            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top',color:colors.text,borderColor: colors.border,}]}
              placeholder="Description"
              placeholderTextColor="#ccc"
              value={description}
              onChangeText={setDescription}
              multiline
            />

      {/* --- Catégories --- */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Catégorie
      </Text>

      {loadingAbos ? (
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ color: colors.text, opacity: 0.6 }}>
            Chargement des abonnements...
          </Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => {
            const available = isCategoryAvailable(item.name);
            const isSelected = selectedCategory === item.name && available;

            return (
              <TouchableOpacity
                disabled={!available}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: available
                      ? isSelected
                        ? colors.primary
                        : colors.card
                      : "rgba(128,128,128,0.15)",
                    borderColor: available
                      ? colors.primary
                      : "rgba(128,128,128,0.3)",
                  },
                ]}
                onPress={() => {
                  if (!available) {
                    Alert.alert(
                      "Abonnement requis",
                      "Vous devez avoir un abonnement actif pour cette catégorie."
                    );
                    return;
                  }
                  setSelectedCategory(item.name);
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={available ? (isSelected ? "#fff" : colors.primary) : "#888"}
                />
                <Text
                  style={{
                    color: available
                      ? isSelected
                        ? "#fff"
                        : colors.primary
                      : "#888",
                    marginTop: 4,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  {item.name}
                </Text>
                {!available && (
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          style={{ marginBottom: 16 }}
        />
      )}

            {/* Date picker */}
            { selectedCategory === 'Événements' &&
            <View style={styles.container}>
              <Text style={[styles.selectedText, {color: colors.text}]}>
                Sélectionné : {date.toLocaleString('fr-FR')}
              </Text>

              {/* Bouton Date */}
              <TouchableOpacity
style={[styles.button,{backgroundColor:colors.primary}]} onPress={() => showMode('date')}>
                <Ionicons name="calendar" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Choisir une date</Text>
              </TouchableOpacity>

              {/* Bouton Heure */}
              <TouchableOpacity
style={[styles.button,{backgroundColor:colors.primary}]} onPress={() => showMode('time')}>
                <Ionicons name="time" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Choisir une heure</Text>
              </TouchableOpacity>

              {show && (
                <DateTimePicker
                  value={date}
                  mode={mode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChange}
                  locale="fr-FR" // 👈 iOS affiche en français automatiquement
                />
              )}
            </View>}

              {/* style */}
            { selectedCategory === 'Événements' &&
              <View style={styles.container}>
              <Text style={[styles.label, {color: colors.text}]}>Choisissez le style :</Text>

              <View style={[styles.pickerWrapper,{borderColor:colors.primary}]}>
                <Picker
                  selectedValue={typeselected}
                  onValueChange={(itemValue) => setTypeSelected(itemValue as "gospel" | "mondaine" | "ballon d'or" | "concour miss")}
                  style={[styles.picker, {color: colors.text, backgroundColor: colors.card}]}
                  dropdownIconColor={colors.primary}
                >
                  <Picker.Item label="🎶 Gospel" value="gospel" />
                  <Picker.Item label="🎵 Mondaine" value="mondaine" />
                  <Picker.Item label="⚽ ballon d'or" value="ballon d'or" />
                  <Picker.Item label="👑 concour miss" value="concour miss" />
                </Picker>
              </View>

            </View>
            }
                
            {/* style */}
            { selectedCategory === 'Rencontre' &&
              <View style={styles.container}>
              <Text style={[styles.label, {color: colors.text}]}>Choisissez votre sex :</Text>

              <View style={[styles.pickerWrapper, {borderColor:colors.primary}]}>
                <Picker
                  selectedValue={sex}
                  onValueChange={(itemValue) => setSex(itemValue as "Homme" | "Femme")}
                  style={[styles.picker, {color: colors.text, backgroundColor: colors.card}]}
                  dropdownIconColor={colors.primary}
                >
                  <Picker.Item label="Homme" value="Homme" />
                  <Picker.Item label="Femme" value="Femme" />
                </Picker>
              </View>

            </View>
            }

            {/* Quantité */}
            { (selectedCategory !== "Transport" && selectedCategory !== "Réservation"
            && selectedCategory !== "Livraison"  && selectedCategory !== "Rencontre" ) && 
            <TextInput
              style={[styles.input,{borderColor:colors.primary, color: colors.text}]}
              placeholder="Quantité"
              placeholderTextColor="#ccc"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />}
            {/* Prix */}

            
            { (selectedCategory === "Transport" || selectedCategory === "Livraison")
            && 
            <Text style={[styles.label, {color: colors.text}]}>Prix par Km :</Text> }
            { selectedCategory === "Réservation" && 
            <Text style={[styles.label, {color: colors.text}]}>Prix par Jour :</Text> }
            {selectedCategory !== "Rencontre" &&
            <TextInput
              style={[styles.input,{borderColor:colors.primary, color: colors.text}]}
              placeholder="Prix"
              placeholderTextColor="#ccc"
              value={prix}
              onChangeText={setPrix}
              keyboardType="numeric"
            />}

            {/* Currency */}
            {selectedCategory !== "Rencontre" &&
            <View style={{ flexDirection: 'row', alignItems: 'center', margin: 20 }}>
              {/* FC Checkbox */}
              <TouchableOpacity
                style={[styles.checkbox, currency === 'FC' && {backgroundColor:colors.primary,borderColor:colors.primary}]}
                onPress={() => setCurrency('FC')}
              >
                {currency === 'FC' && <View style={styles.inner} />}
              </TouchableOpacity>
              <Text style={[styles.label,{color:colors.text}]}>FC</Text>

              {/* USD Checkbox */}
              <TouchableOpacity
                style={[styles.checkbox, currency === 'USD' && {backgroundColor:colors.primary,borderColor:colors.primary}]}
                onPress={() => setCurrency('USD')}
              >
                {currency === 'USD' && <View style={styles.inner} />}
              </TouchableOpacity>
              <Text style={[styles.label,{color:colors.text}]}>USD</Text>
            </View>}

            {/* Bouton pour choisir les photos */}
            <TouchableOpacity
style={[styles.imageButton,{backgroundColor:colors.primary}]} onPress={pickImages}>
              <Ionicons name="images" size={22} color="#fff" />
              <Text style={[styles.imageButtonText]}>Ajouter des photos</Text>
            </TouchableOpacity>

            {/* Preview des photos sélectionnées */}
            <FlatList
              data={images}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              style={{ marginVertical: 12 }}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <ImageBackground source={{ uri: item }} style={styles.preview} imageStyle={{ borderRadius: 12 }}>
                
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setImages(images.filter((img) => img !== item))}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                  </TouchableOpacity>
                </ImageBackground>
              )}
            />

            {/* Bouton publier */}
            <TouchableOpacity
style={[styles.button,{backgroundColor:colors.primary}]} onPress={handlePublish}
disabled={isLoading}>
                
              <View style={{flexDirection:'row',alignItems:'center'}}>
                
                {isLoading && <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="sync" size={30} color="#fff" />
                </Animated.View>}
                <Text style={styles.buttonText}>Publier</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

    </KeyboardAvoidingView>
  );
}

// ------------------------------------------------------------------
// 5. Combined Styles
// ------------------------------------------------------------------

// Local styles for the SearchableSelect to avoid conflicts
const localStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop: 10,
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
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 10,
    marginTop:20,
  },
  card: {
    marginTop:20,
    paddingHorizontal:20
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,255)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    
  },
  categoryItem: {
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginRight: 10,
    width: 90,
  },
  
    lockBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(255,0,0,0.7)",
    borderRadius: 8,
    padding: 2,
  },
  
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  imageButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
  },
  button: {
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  selectedText: {
    marginBottom: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#032D23',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  inner: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  
  label: {
    fontSize: 16,
    marginHorizontal:5,
    fontWeight: "600",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#032D23",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#032D23", // couleur du texte
  },
  result: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "500",
  },
  
  option: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  text: {
    marginLeft: 10,
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 20,
    margin: 5,
    width:35,
    // Note: 'fixed' is not a standard RN property. Using 'absolute' might be better here.
    position:'absolute', 
    top:5,
    right:5,
  },
  
});