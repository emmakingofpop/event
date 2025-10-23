import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from "@react-native-picker/picker";
import { Theme, useTheme } from '@react-navigation/native'; // Import Theme type
import * as ImagePicker from 'expo-image-picker';
import {
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
  View
} from 'react-native';
import { updateArticle } from "../services/articleService";

import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
// 2. SearchableSelect Component Types & Component (Reused from Poste)
// ------------------------------------------------------------------
interface SearchableSelectProps {
  label: string;
  options: string[];
  onSelect: (value: string) => void;
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
                placeholderTextColor={colors.text + '99'}
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
// 3. Main UpdateArticle Component
// ------------------------------------------------------------------

export type Article = {
  id?: string;
  uid: string;
  title: string;
  description: string;
  category: string;
  quantity?: string | null;
  images: string[];
  prix?: string | null;
  currency?: 'FC' | 'USD' | null;
  date?: string | null;
  style?: 'gospel' | 'mondaine' | "ballon d'or" | "concour miss" | null;
  sex?: 'Homme' | 'Femme' | null;
  transportType?: 'voiture' | 'moto' | null;
  town?: string | null; // <--- ADDED TOWN FIELD
  created_at: string;
  updated_at: string;
};


const categories = [
  { name: 'Événements', icon: 'calendar' },
  { name: 'Shopping', icon: 'cart' },
  { name: 'Transport', icon: 'car' },
  { name: 'Réservation', icon: 'bed' },
  { name: 'Livraison', icon: 'bicycle' },
  { name: 'Rencontre', icon: 'heart' },
];

export default function UpdateArticle() {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [typeselected, setTypeSelected] = useState<"gospel" | "mondaine" | "ballon d'or" | "concour miss">("gospel");
  const [sex, setSex] = useState<"Homme" | "Femme">("Homme");
  const [selected, setSelected] = useState<"voiture" | "moto" | null>(null);
  const [prix, setPrix] = useState('');
  const [currency, setCurrency] = useState<'FC' | 'USD'>('FC');
  const [isLoading,setIsloading] = useState<boolean>(false)
  const [article, setArticle] = useState<(Article & {id:string})|null>(null);
  // --- New State for Town ---
  const [selectedTown, setSelectedTown] = useState<string | null>(null);
  // ---------------------------
  const { colors } = useTheme();
  const { user } = useAuth();
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spinning()
  }, []);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@article_to_update');
        if (jsonValue != null) {
          setArticle(JSON.parse(jsonValue));
        }
      } catch (error) {
        console.error('Error loading article:', error);
      }
    };
    loadArticle();
  }, []);

  useEffect(() => {
    resetForm(article)
  }, [article])

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


  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });


    if (!result.canceled) {
      const uris = result.assets.map((a: any) => a.uri);
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

  const miseAjourArticle = async (article:(Article & {id:string})) => {
    try {
      const updateArticles = await updateArticle(article.id,article);
      return updateArticles
    } catch (error) {
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
    const articles: Article = {
      uid: user?.uid || "anonymous", // Assurez-vous que l'utilisateur est connecté
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
      town: selectedTown, // <--- Add selectedTown to the updated article
      created_at: article?.created_at || now, // garde la date de création si existante
      updated_at: now,
    };

    setIsloading(true)
    const newArticle = await miseAjourArticle({...articles,id:article!.id})

    if (newArticle) {
      setIsloading(false)
      setInputToDefault()
      Alert.alert("Succès", "Article Modifier avec succès !");
      router.push("/liste");
    } else {
      setIsloading(false)
      Alert.alert("Erreur", "Échec de la Modification de l'article. Veuillez réessayer !");
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


  const resetForm = (article?: (Article & {id:string})|null) => {
    setTitle(article?.title ?? "");
    setDescription(article?.description ?? "");
    setSelectedCategory(article?.category ?? null);
    setQuantity(article?.quantity ?? "");
    setImages(article?.images ?? []);
    setPrix(article?.prix ?? "");
    setCurrency(article?.currency ?? "FC");
    setDate(article?.date ? new Date(article.date) : new Date());
    setTypeSelected(article?.style ?? "gospel");
    setSex(article?.sex ?? "Homme");
    setSelected(article?.transportType ?? null);
    setSelectedTown(article?.town ?? null); // <--- Initialize selectedTown
  };



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={[styles.card,{paddingBottom: 70,maxHeight:'80%',}]}
          keyboardShouldPersistTaps="handled"
          >
          <Text style={[styles.title,{color:colors.text}]}>Modifier article</Text>

          {/* Sélection de la catégorie */}
          { selectedCategory !== "Transport" &&
          <TextInput
            style={[styles.input,{color:colors.text, borderColor: colors.border}]}
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
            colors={colors}
          />
          {/* ---------------------------------- */}

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
                color={selected === "voiture" ? colors.primary : colors.text}
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
                color={selected === "moto" ? colors.primary : colors.text}
              />
              <Text style={[styles.text, {color: colors.text}]}>Moto</Text>
            </TouchableOpacity>

          </View>}

          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top',color:colors.text, borderColor: colors.border }]}
            placeholder="Description"
            placeholderTextColor="#ccc"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {/* Sélection de la catégorie */}
          <Text style={[styles.sectionTitle,{color:colors.text}]}>Catégorie</Text>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,{backgroundColor:colors.card, borderColor: colors.border},
                  selectedCategory === item.name && {backgroundColor: colors.primary, borderColor: colors.primary},
                ]}
                onPress={() => setSelectedCategory(item.name)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={selectedCategory === item.name ? '#fff' : colors.primary}
                />
                <Text
                  style={{
                    color: selectedCategory === item.name ? '#fff' : colors.primary,
                    marginTop: 4,
                    fontSize: 12,
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            style={{ marginBottom: 16 }}
          />

          {/* Date picker */}
          { selectedCategory === 'Événements' &&
          <View style={styles.container}>
            <Text style={[styles.selectedText, {color: colors.text}]}>
              Sélectionné : {date.toLocaleString('fr-FR')}
            </Text>

            {/* Bouton Date */}
            <TouchableOpacity style={[styles.button, {backgroundColor: colors.primary}]} onPress={() => showMode('date')}>
              <Ionicons name="calendar" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Choisir une date</Text>
            </TouchableOpacity>

            {/* Bouton Heure */}
            <TouchableOpacity style={[styles.button, {backgroundColor: colors.primary}]} onPress={() => showMode('time')}>
              <Ionicons name="time" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Choisir une heure</Text>
            </TouchableOpacity>

            {show && (
              <DateTimePicker
                value={date}
                mode={mode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChange}
                locale="fr-FR"
              />
            )}
          </View>}

            {/* style */}
          { selectedCategory === 'Événements' &&
            <View style={styles.container}>
            <Text style={[styles.label, {color: colors.text}]}>Choisissez le style :</Text>

            <View style={[styles.pickerWrapper, {borderColor: colors.primary}]}>
              <Picker
                selectedValue={typeselected}
                onValueChange={(itemValue) => setTypeSelected(itemValue as "gospel" | "mondaine" | "ballon d'or" | "concour miss")}
                style={[styles.picker, {color: colors.text, backgroundColor: colors.card}]}
                dropdownIconColor={colors.primary}
              >
                <Picker.Item label="🎶 Gospel" value="gospel" />
                <Picker.Item label="🎵 Mondaine" value="mondaine" />
                <Picker.Item label="ballon d'or" value="ballon d'or" />
                <Picker.Item label="concour miss" value="concour miss" />
              </Picker>
            </View>

          </View>
          }

          {/* style */}
          { selectedCategory === 'Rencontre' &&
            <View style={styles.container}>
            <Text style={[styles.label, {color: colors.text}]}>Choisissez votre sex :</Text>

            <View style={[styles.pickerWrapper, {borderColor: colors.primary}]}>
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
          { (selectedCategory !== "Transport" && selectedCategory !== "Réservation" && selectedCategory !== "Livraison" && selectedCategory !== "Rencontre" ) &&
          <TextInput
            style={[styles.input, {color:colors.text, borderColor: colors.border}]}
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
            style={[styles.input, {color:colors.text, borderColor: colors.border}]}
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
              style={[styles.checkbox, currency === 'FC' && {backgroundColor:colors.primary, borderColor:colors.primary}]}
              onPress={() => setCurrency('FC')}
            >
              {currency === 'FC' && <View style={styles.inner} />}
            </TouchableOpacity>
            <Text style={[styles.label,{color:colors.text}]}>FC</Text>

            {/* USD Checkbox */}
            <TouchableOpacity
              style={[styles.checkbox, currency === 'USD' && {backgroundColor:colors.primary, borderColor:colors.primary}]}
              onPress={() => setCurrency('USD')}
            >
              {currency === 'USD' && <View style={styles.inner} />}
            </TouchableOpacity>
            <Text style={[styles.label,{color:colors.text}]}>USD</Text>
          </View>}

          {/* Bouton pour choisir les photos */}
          <TouchableOpacity style={[styles.imageButton, {backgroundColor: colors.primary}]} onPress={pickImages}>
            <Ionicons name="images" size={22} color="#fff" />
            <Text style={styles.imageButtonText}>Ajouter des photos</Text>
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
          <TouchableOpacity style={[styles.button, {backgroundColor: colors.primary}]} onPress={handlePublish} disabled={isLoading}>
            <View style={{flexDirection:'row',alignItems:'center'}}>
              {isLoading && <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="sync" size={30} color="#fff" />
              </Animated.View>}
              <Text style={styles.buttonText}>Modifier</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

    </KeyboardAvoidingView>
  );
}

// ------------------------------------------------------------------
// 4. Combined Styles (Including localStyles for SearchableSelect)
// ------------------------------------------------------------------

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
    padding: 5,
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
    borderWidth: 1
  },
  categoryItem: {
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginRight: 10,
    width: 90,
    borderWidth: 1
  },
  categorySelected: {
    backgroundColor: '#032D23',
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
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    borderColor: '#032D23',
    backgroundColor: '#032D23',
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
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
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
    position:'absolute',
    top:5,
    right:5,
  },

});