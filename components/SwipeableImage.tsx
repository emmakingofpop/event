import { useAuth } from "@/contexts/AuthContext";
import { FactureService } from "@/services/FactureService";
import { getProfileByUid } from "@/services/profileService";
import { tel } from "@/type/type";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Dimensions, Linking, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, ScrollView } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width,height } = Dimensions.get("window");

type SwipeCardProps = {
  images: string[];
};

const categories = [
  { name: 'Événements', icon: 'calendar' },
  { name: 'Shopping', icon: 'cart' },
  { name: 'Transport', icon: 'car' },
  { name: 'Réservation', icon: 'bed' },
  { name: 'Livraison', icon: 'bicycle' },
  { name: 'Rencontre', icon: 'heart' },
];


export default function SwipeableImage({ images }: SwipeCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const { colors } = useTheme();
  const { item,online } = useAuth();
  const [visible, setVisible] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
  const [quantity, setQuantity] = useState("1");
  const [isLoading, setIsloading] = useState<boolean>(false);
  const { user } = useAuth();

  const desc = `Bonjour, je souhaite effectuer l'achat de ${item.title} / ${item.style || ''}. Merci !`
  

  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");
    

  }, [])

  
  useEffect(() => {
   
    if(item.category === "Événements" && user?.uid){
        getProfileByUserId(user?.uid)
    }

  }, [user])

  const getProfileByUserId = async (uid: string) => {
      try {
        setIsloading(true)
        const userP = await getProfileByUid(uid)
        if(userP.length > 0) setUserProfile(userP[0])
          
      } catch{
        
      }finally{
        setIsloading(false)
      }
  }

  const loadProfile = async (phone: string, message: string) => {
    try {
      setIsloading(true)
      if (userProfile?.tel) {
        handleWhatsApp(userProfile?.tel,message)
      } else {
        getProfileByUserId(user?.uid)
        if(userProfile?.tel) handleWhatsApp(userProfile?.tel,message)
      }
    } catch  {
      
    }finally{
      setIsloading(false)
    }
    
  }


  // 🔹 Fonction d’envoi de message WhatsApp
  const handleWhatsApp = (phone: string, message: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/\s+/g, "");
    const formatted = cleaned.startsWith("0") ? `243${cleaned.slice(1)}` : cleaned;

    const encodedMessage = encodeURIComponent(message || "");
    const url = `https://wa.me/${formatted}?text=${encodedMessage}`;
    Linking.openURL(url).catch(() => console.error("Cannot open WhatsApp"));
  };

  
    // 
  
    const handleAchatEvent = async () => {
      
        try {
          setIsloading(true)
          const desc = `Achat ${item.title} / ${item.style || ''} `
          const id = await FactureService.createFacture({
            uid: user?.uid,
            etat: "en attente",
            posteId:item.id || '',
            scanned:false,
            items: [
              { id: "1", nom: desc, quantite: 0, prix: 0 },
            ],
          });
  
          if (id) {
            handleWhatsApp(
                tel,
                `Bonjour, je souhaite effectuer l'achat de ${item.title} / ${item.style || ''} , 
              par la facture numéro : ${id}. Merci !`
              );
  
              setIsloading(false)
          }
  
        } catch {
              setIsloading(false)
        }
    }


  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1 < images.length ? prev + 1 : 0));
    translateX.value = 0; // reset for next card
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > width * 0.3) {
        translateX.value = withSpring(
          translateX.value > 0 ? width : -width,
          {},
          () => runOnJS(handleNext)()
        );
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  
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


  if (images.length === 0) {
    return <View />;
  }


  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.Image
          source={{ uri: images[currentIndex] }}
          style={[
            {
                width: '100%',
                height: width * 1.2,
                borderRadius: 20,
                position: "absolute",
                top: 0,

            },
            animatedStyle,
          ]}
          resizeMode="cover"
        />
      </GestureDetector>

          <View style={{flex:1,position:'absolute',top:0,width:'100%',height:width*1.2}}>
            <TouchableOpacity style={styles.arrow} onPress={() => router.back()}>
                <Ionicons
                    name="arrow-back"
                    size={22}
                    style={styles.priceText}
                    />
            </TouchableOpacity>
            
            {item.prix && (
                  <View style={[styles.priceBadge,{flexDirection:'row',alignItems:'center'}]}>
                    <Text style={styles.priceText}>
                      {item.currency === "USD" ? "$" : "FC"} {item.prix} {["Transport", "Livraison"].includes(item.category) ? "/Km" : ""} {item.category === "Réservation" ? "/Jour" : ""}
                      {item.category === "Événements" ? "/Ticket" : ""} {item.category === "Shopping" ? "/Article" : ""}
                    </Text>
                    
                  </View>
                )}
                { item.category === "Événements" && item.date && 
                  <Text style={{ position: 'absolute', bottom:35, left: 10, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 15, padding: 5 }}>
                    {isDatePast(item.date) ? timeDiff(item.date) : timeRemaining(item.date)}
                  </Text>
                }
                {["Transport", "Livraison"].includes(item.category) && 
                  <View style={[{position: 'absolute', bottom:1, right: 2, backgroundColor: 'rgba(255,255,255,1)', borderRadius: 15, padding: 5}]}>
                    <Text style={{color:colors.text,fontWeight:'700',fontSize:12}}>
                      {online ? "🟢 enligne" : "🔴 Horsline"}
                    </Text>
            
                  </View>}

                  { images.length > 1 &&
                    <View style={{position: 'absolute', bottom:10, alignSelf:'center', flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                      {images.map((_, index) => (
                        <View
                          key={index}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: index === currentIndex ? colors.primary : 'rgba(255, 255, 255, 0.5)',
                            margin: 4,
                          }}
                        />
                      ))}
                    </View>

                  }

                  
                {/* category Icon */}
                <Ionicons
                name={categories.find(cat => cat.name === item.category)?.icon || 'pricetag' as any}
                size={50}
                color={colors.primary}
                style={{ position: 'absolute', top: 70, right: 10, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 15, padding: 5 }}
                />
                  
          </View>
          <ScrollView showsVerticalScrollIndicator={true} style={{flex:1,position:'absolute',top:width*1.2,width:'100%',height:height - (width*1.2),backgroundColor:colors.background,padding:10}}>
            <Text style={{fontSize:15,fontWeight:'700',color:colors.text,marginBottom:40}}>
                {item?.description}
            </Text>
          </ScrollView>

          {item.category === "Événements" ? (
              
          <TouchableOpacity style={{flex:1,position:'absolute',bottom:0,width:'100%',height:height*0.1,backgroundColor:colors.primary,justifyContent:'center',alignItems:'center'}}
                onPress={() => handleAchatEvent()}
                    >  
                    <Ionicons
                    name="cart"
                    size={22}
                    color={'white'}
                    />
                    <Text style={{color:'white'}}>Acheter</Text>
          </TouchableOpacity>
          ):(
              
          <TouchableOpacity style={{flex:1,position:'absolute',bottom:0,width:'100%',height:height*0.1,backgroundColor:colors.primary,justifyContent:'center',alignItems:'center'}}
                onPress={() => {
                  if(user?.uid) loadProfile(userProfile?.tel,desc)
                }}>
                    <Ionicons
                    name="cart"
                    size={22}
                    color={'white'}
                    />
                    <Text style={{color:'white'}}>Acheters</Text>
          </TouchableOpacity>
          )}


          {/* Popup Card */}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Enter Quantity</Text>
            
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={() => setVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn,colors.primary ? {backgroundColor: colors.primary} : {backgroundColor: '#0a84ff'}]}
                onPress={() => {
                  
                  setVisible(false);
                }}
              >
                <Text style={styles.btnText}>Proceder</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

        <StatusBar hidden={true} />
        </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  openBtn: { padding: 12, backgroundColor: "#0a84ff", borderRadius: 8 },
  openBtnText: { color: "#fff", fontWeight: "bold" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: 280,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 6,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  cancelBtn: {
    padding: 10,
    marginRight: 10,
  },
  confirmBtn: {
    padding: 10,
    borderRadius: 8,
  },
  btnText: { color: "black", fontWeight: "bold" },
    priceBadge: {
        position: 'absolute',
        top: 30,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        zIndex: 10,
      },
      priceText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,   
        textAlign: 'center',
      },
      categoryBadge: {  
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        zIndex: 10,
      },
        categoryText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
      },
      arrow: {
        position: 'absolute',
        top: 30,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        zIndex: 10,
      },
  });