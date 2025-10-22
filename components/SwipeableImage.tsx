import { useAuth } from "@/contexts/AuthContext";
import { FactureService } from "@/services/FactureService";
import { tel } from "@/type/type";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector, ScrollView } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

type SwipeCardProps = {
  images: string[];
};

const categories = [
  { name: "Événements", icon: "calendar" },
  { name: "Shopping", icon: "cart" },
  { name: "Transport", icon: "car" },
  { name: "Réservation", icon: "bed" },
  { name: "Livraison", icon: "bicycle" },
  { name: "Rencontre", icon: "heart" },
  { name: "Musique", icon: "musical-notes" },
  { name: "Streaming", icon: "musical-notes" },
];

// 🔹 Génère un message WhatsApp personnalisé selon la catégorie
const getPersonalizedMessage = (category: string, item: any, factureId?: string) => {
  const base = `Bonjour 👋,\n`;

  switch (category) {
    case "Événements":
      return `${base}Je souhaite réserver un ticket pour **${item.title}** ${
        item.date ? `le ${new Date(item.date).toLocaleDateString()}` : ""
      }. 🎫\nNuméro de facture : ${factureId || "à créer"}.`;
    case "Shopping":
      return `${base}Je souhaite acheter **${item.title}** (${item.style || "modèle standard"}). 🛍️\nMerci de me confirmer la disponibilité.`;
    case "Transport":
      return `${base}Je souhaite réserver un trajet pour **${item.title}** 🚗.\nMerci de m’envoyer le tarif par km et la disponibilité.`;
    case "Réservation":
      return `${base}Je souhaite faire une réservation pour **${item.title}** 🏨.\nMerci de me confirmer les dates disponibles.`;
    case "Livraison":
      return `${base}Je souhaite organiser une livraison pour **${item.title}** 🚴.\nMerci de m’envoyer les détails du service.`;
    case "Rencontre":
      return `${base}Je souhaite entrer en contact pour **${item.title}** ❤️.\nMerci de m’indiquer les modalités.`;
    case "Musique":
      return `${base}Je suis intéressé(e) par **${item.title}** 🎵.\nPouvez-vous m’en dire plus sur l’écoute ou le téléchargement ?`;
    case "Streaming":
      return `${base}Je souhaite m’abonner à **${item.title}** 📺.\nMerci de me donner les informations d’accès.`;
    default:
      return `${base}Je suis intéressé(e) par **${item.title}**.\nMerci de m’envoyer plus d’informations.`;
  }
};

export default function SwipeableImage({ images }: SwipeCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const { colors } = useTheme();
  const { item, online, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");
  }, []);

  // 🔹 Envoi de message WhatsApp
  const handleWhatsApp = (phone: string, message: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/\s+/g, "");
    const formatted = cleaned.startsWith("0") ? `243${cleaned.slice(1)}` : cleaned;
    const encodedMessage = encodeURIComponent(message || "");
    const url = `https://wa.me/${formatted}?text=${encodedMessage}`;
    Linking.openURL(url).catch(() => console.error("Impossible d’ouvrir WhatsApp"));
  };

  // 🔹 Achat / Contact avec facture
  const handleSendMessage = async (telphone: string) => {
  try {
    // 🔹 1st confirmation
    Alert.alert(
      "Confirmation",
      "Souhaitez-vous vraiment envoyer le message ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui",
          onPress: () => {
            // 🔹 2nd confirmation
            Alert.alert(
              "Vérification finale",
              "Êtes-vous sûr de vouloir procéder à l’envoi ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Confirmer",
                  onPress: async () => {
                    setIsLoading(true);
                    try {
                      const factureId =
                        item.category === "Événements"
                          ? await FactureService.createFacture({
                              uid: user?.uid,
                              etat: "en attente",
                              posteId: item.id || "",
                              scanned: false,
                              items: [
                                {
                                  id: "1",
                                  nom: item.title,
                                  quantite: 1,
                                  prix: item.prix || 0,
                                },
                              ],
                            })
                          : "";

                      const message = getPersonalizedMessage(
                        item.category,
                        item,
                        factureId || ""
                      );
                      handleWhatsApp(telphone, message);
                    } catch (error) {
                      console.error(error);
                      Alert.alert(
                        "Erreur",
                        "Impossible d’envoyer le message. Veuillez réessayer."
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  } catch  {
    Alert.alert("Erreur","Essayer encore")
  }
};


  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1 < images.length ? prev + 1 : 0));
    translateX.value = 0;
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

    if (diff <= 0) return "Expiré";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} jour(s) restant(s)` : `${Math.floor(diff / (1000 * 60 * 60))} heure(s) restante(s)`;
  };

  if (images.length === 0) return <View />;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <GestureDetector gesture={panGesture}>
        <Animated.Image
          source={{ uri: images[currentIndex] }}
          style={[
            {
              width: "100%",
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

      <View style={{ flex: 1, position: "absolute", top: 0, width: "100%", height: width * 1.2 }}>
        <TouchableOpacity style={styles.arrow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>

        {item.prix && (
          <View style={[styles.priceBadge, { flexDirection: "row", alignItems: "center" }]}>
            <Text style={styles.priceText}>
              {item.currency === "USD" ? "$" : "FC"} {item.prix}{" "}
              {["Transport", "Livraison"].includes(item.category) ? "/Km" : ""}
              {item.category === "Réservation" ? "/Jour" : ""}
              {item.category === "Événements" ? "/Ticket" : ""}
              {item.category === "Shopping" ? "/Article" : ""}
            </Text>
          </View>
        )}

        {item.category === "Événements" && item.date && (
          <Text
            style={{
              position: "absolute",
              bottom: 35,
              left: 10,
              backgroundColor: "rgba(255,255,255,0.7)",
              borderRadius: 15,
              padding: 5,
            }}
          >
            {isDatePast(item.date) ? "Expiré" : timeRemaining(item.date)}
          </Text>
        )}

        {["Transport", "Livraison"].includes(item.category) && (
          <View
            style={{
              position: "absolute",
              bottom: 1,
              right: 2,
              backgroundColor: "rgba(255,255,255,1)",
              borderRadius: 15,
              padding: 5,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>
              {online ? "🟢 En ligne" : "🔴 Hors ligne"}
            </Text>
          </View>
        )}

        {images.length > 1 && (
          <View
            style={{
              position: "absolute",
              bottom: 10,
              alignSelf: "center",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {images.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index === currentIndex ? colors.primary : "rgba(255, 255, 255, 0.5)",
                  margin: 4,
                }}
              />
            ))}
          </View>
        )}

        <Ionicons
          name={(categories.find((cat) => cat.name === item.category)?.icon || "pricetag") as any}
          size={50}
          color={colors.primary}
          style={{
            position: "absolute",
            top: 70,
            right: 10,
            backgroundColor: "rgba(255,255,255,0.7)",
            borderRadius: 15,
            padding: 5,
          }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={true}
        style={{
          flex: 1,
          position: "absolute",
          top: width * 1.2,
          width: "100%",
          height: height - width * 1.2,
          backgroundColor: colors.background,
          padding: 10,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 40 }}>
          {item?.description}
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={{
          flex: 1,
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: height * 0.1,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() =>{
          if (item.category === "Événements") {
            handleSendMessage(tel)
          } else {
            handleSendMessage(user.phoneNumber)
          }
          }}
      >
        <Ionicons name="cart" size={22} color="white" />
        <Text style={{ color: "white" }}>{isLoading ? "Envoi..." : "Contacter / Acheter"}</Text>
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Entrer la quantité</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={() => setVisible(false)}>
                <Text style={styles.btnText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmBtn,
                  colors.primary ? { backgroundColor: colors.primary } : { backgroundColor: "#0a84ff" },
                ]}
                onPress={() => setVisible(false)}
              >
                <Text style={styles.btnText}>Procéder</Text>
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
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  cancelBtn: { padding: 10, marginRight: 10 },
  confirmBtn: { padding: 10, borderRadius: 8 },
  btnText: { color: "black", fontWeight: "bold" },
  priceBadge: {
    position: "absolute",
    top: 30,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    zIndex: 10,
  },
  priceText: { color: "white", fontWeight: "bold", fontSize: 16, textAlign: "center" },
  arrow: {
    position: "absolute",
    top: 30,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    zIndex: 10,
  },
});
