import { useAuth } from '@/contexts/AuthContext';
import { articleCollection, deleteArticle, getArticlesByCategory } from "@/services/articleService";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  ImageBackground,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';

 export type Article = {
  id?: string; // optionnel, Firestore le génère
  title: string;
  description: string;
  category: string; // par exemple: 'Événements', 'Transport', etc.
  quantity?: string | null; // peut être vide selon catégorie
  images: string[]; // URLs des images uploadées
  prix?: string | null;
  currency?: 'FC' | 'USD' | null;
  date?: string | null; // ISO string si catégorie = Événements
  style?: 'gospel' | 'mondaine' | null; // si catégorie = Événements
  sex?: 'Homme' | 'Femme' | null;
  transportType?: 'voiture' | 'moto' | null; // si catégorie = Transport
  created_at: string; // ISO string
  updated_at: string; // ISO string
};

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
  const [isLoading,setIsloading] = useState<boolean>(false)
  const spinAnim = useRef(new Animated.Value(0)).current;
  const { setItems,online,categorie } = useAuth();
  
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
  

  useEffect(() => {
    spinning()
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(

      articleCollection,
      async (snapshot) => {
        setLoading(false);
        await getAllArticles(categorie)
        
      },
      (error) => {
        console.error("Error listening to articles:", error);
        setLoading(true);
      }
    );

    // Cleanup when component unmounts
    return () => unsubscribe();
    
  }, [categorie])

  const getAllArticles= async (cat:string) => {
    try {
      const allArticles = await getArticlesByCategory(cat);
      setData(allArticles)
      setLoading(true);
      return allArticles
    } catch (error) {
      setLoading(true);
      return null
    }
  }

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
        // Convert the object to string before storing
        
        await AsyncStorage.setItem('@article_to_update', JSON.stringify(item));
        router.push(`/UpdateArticle`); // navigate after saving
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

    if (diff <= 0) return "Expiré"; // déjà passé

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
      // Date dans le futur → jours restants
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return `${days} jour(s) restant(s)`;
    } else {
      // Date déjà passée → heures écoulées
      const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
      return `${hours} heure(s) passé(es)`;
    }
  };

  const goToDetails = (item: (Article & {id:string})) => {
    setItems(item);
    router.push('/ViewDetails');
  }


  
  if (!loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }


  const renderCard = ({ item }: { item: (Article & {id:string}) }) => {
    return (
      <TouchableOpacity key={item.id} style={styles.cardWrapper}
        activeOpacity={0.8}
        onPress={() => goToDetails(item)}
      >
        <ImageBackground
          source={{ uri: item.images[0] }} // première image de l'article
          style={styles.image}
          imageStyle={styles.imageStyle}
        >
          {item.prix && (
            <View style={[styles.priceBadge,{flexDirection:'row',alignItems:'center'}]}>
              <Text style={styles.priceText}>
                {item.currency === "USD" ? "$" : "FC"} {item.prix} {["Transport", "Livraison"].includes(item.category) ? "/Km" : ""} {item.category === "Réservation" ? "/Jour" : ""}
                {item.category === "Événements" ? "/Ticket" : ""} {item.category === "Shopping" ? "/Article" : ""}
              </Text>
              
            </View>
          )}
          { item.category === "Événements" && item.date && 
            <Text style={{ position: 'absolute', bottom:5, left: 10, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 15, padding: 5 }}>
              {isDatePast(item.date) ? timeDiff(item.date) : timeRemaining(item.date)}
            </Text>
          }
          {["Transport", "Livraison"].includes(item.category) && 
            <View style={[{position: 'absolute', bottom:1, right: 2, backgroundColor: 'rgba(255,255,255,1)', borderRadius: 15, padding: 5}]}>
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
          style={{ position: 'absolute', top: 9, left: 10, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 15, padding: 5 }}
        />

        <View style={styles.cardBody}>
          
          <Text numberOfLines={1} style={styles.title}>
            {item.category === "Transport" ? `Taxi ${item.transportType}` : item.title}
          </Text>

          <Text numberOfLines={2} style={styles.description}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  
  return (
    <View style={{ flex: 1,paddingTop:28 ,backgroundColor: colors.background }}>

      {/* filter */}


      {/* Liste */}
      {(!data || data.length === 0) ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.text }}>Aucun article trouvé</Text>
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
          style={{ maxHeight: 550 }}
        />
      )}
    </View>
  );

}

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
    backgroundColor: "#fff",
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
  priceBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
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
    padding: 10,
    backgroundColor: "#fff",
    minHeight: 86,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111",
  },
  description: {
    fontSize: 12,
    color: "#666",
  },
})

export default ListePoste