import { useAuth } from "@/contexts/AuthContext";
import { createAbonnement } from "@/services/AbonnementServices";
import { tel } from "@/type/type";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Header from "./components/header";

export const categories = [
  { name: "Événements", icon: "calendar" },
  { name: "Shopping", icon: "cart" },
  { name: "Transport", icon: "car" },
  { name: "Réservation", icon: "bed" },
  { name: "Livraison", icon: "bicycle" },
  { name: "Rencontre", icon: "heart" },
  { name: "Musique", icon: "musical-notes" },
  { name: "Streaming", icon: "musical-notes" },
];

const AbonnementScreen = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // 🔹 Fonction d’envoi de message WhatsApp
  const handleWhatsApp = (phone: string, message: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/\s+/g, "");
    const formatted = cleaned.startsWith("0") ? `243${cleaned.slice(1)}` : cleaned;

    const encodedMessage = encodeURIComponent(message || "");
    const url = `https://wa.me/${formatted}?text=${encodedMessage}`;
    Linking.openURL(url).catch(() => console.error("Cannot open WhatsApp"));
  };

  // 🔹 Crée l’abonnement et envoie le message WhatsApp
  const handleSubscribe = async () => {
    if (!selectedCategory) return Alert.alert("⚠️ Sélectionnez une catégorie");
    if (!user?.uid) return Alert.alert("⚠️ Vous devez être connecté");

    try {
      setLoading(true);
      const result = await createAbonnement(user.uid, selectedCategory, selectedMonths);

      const message =
        result.status === "created"
          ? `✅ Abonnement !
        
Catégorie : ${selectedCategory}
Durée : ${selectedMonths} mois
Numéro d’abonnement : ${result.numero}

Merci pour votre confiance 🎉`
          : `🔄 Abonnement renouvelé !
        
Catégorie : ${selectedCategory}
Durée : ${selectedMonths} mois
Nouveau d’abonnement  : ${result.numero}

Merci de continuer avec nous 💫`;

      handleWhatsApp(tel, message);

      setSelectedCategory(null);
      setSelectedMonths(1);
    } catch (error: any) {
      Alert.alert("⚠️ Info", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ marginRight: 10 }}>
        <Header />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Souscrire à un abonnement</Text>

      {/* Catégories */}
      <View style={styles.categoriesContainer}>
        {categories.map((cat, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryButton,
              {
                backgroundColor:
                  selectedCategory === cat.name ? colors.primary : "rgba(255,255,255,0.1)",
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSelectedCategory(cat.name)}
          >
            <Ionicons
              name={cat.icon as any}
              size={26}
              color={selectedCategory === cat.name ? "#fff" : colors.text}
            />
            <Text
              style={{
                color: selectedCategory === cat.name ? "#fff" : colors.text,
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Durée */}
      <Text style={[styles.subtitle, { color: colors.text }]}>Durée de l’abonnement</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[...Array(12)].map((_, i) => {
          const m = i + 1;
          return (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMonths(m)}
              style={[
                styles.monthButton,
                {
                  backgroundColor:
                    selectedMonths === m ? colors.primary : "rgba(255,255,255,0.1)",
                },
              ]}
            >
              <Text
                style={{
                  color: selectedMonths === m ? "#fff" : colors.text,
                  fontWeight: "600",
                }}
              >
                {m} mois
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bouton souscrire */}
      <TouchableOpacity
        disabled={loading}
        onPress={handleSubscribe}
        style={[
          styles.subscribeButton,
          { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 },
        ]}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
          {loading ? "En cours..." : "Souscrire"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AbonnementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 28,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 16,
    textAlign: "center",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  categoryButton: {
    width: "30%",
    height: 90,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
    borderWidth: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  monthButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  subscribeButton: {
    marginTop: 30,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
});
