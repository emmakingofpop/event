import { useAuth } from "@/contexts/AuthContext";
import { getUserAbonnements } from "@/services/AbonnementServices";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Header from "./components/header";

const categoryIcons: Record<string, string> = {
  Événements: "calendar",
  Shopping: "cart",
  Transport: "car",
  Réservation: "bed",
  Livraison: "bicycle",
  Rencontre: "heart",
  Musique: "musical-notes",
};

const ListeAbonnementScreen = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [abonnements, setAbonnements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbonnements = async () => {
      try {
        const data = await getUserAbonnements(user.uid);
        setAbonnements(data);
      } catch (error) {
        console.error("Erreur de récupération:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAbonnements();
  }, [user.uid]);

  const calculateRemainingDays = (endDateString: string) => {
    const now = new Date();
    const endDate = new Date(endDateString);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // in days
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={{ marginRight: 10 }}>
        <Header />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        Mes Abonnements
      </Text>

      {abonnements.length === 0 ? (
        <Text style={{ textAlign: "center", color: colors.text, opacity: 0.6 }}>
          Aucun abonnement trouvé.
        </Text>
      ) : (
        abonnements.map((abo, index) => {
          const daysLeft = calculateRemainingDays(abo.endDate);
          const iconName = categoryIcons[abo.category] || "pricetag";
          const isExpired = daysLeft <= 0;

          const statusText = abo.active
            ? "✅ Payé (Actif)"
            : "❌ Non payé";
          const statusColor = abo.active ? "#4CAF50" : "#F44336";

          return (
            <View
              key={index}
              style={[
                styles.card,
                {
                  borderColor: abo.active ? colors.primary : "gray",
                  backgroundColor: abo.active
                    ? "rgba(0,150,255,0.08)"
                    : "rgba(255,0,0,0.05)",
                },
              ]}
            >
              {/* Header icon + category */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name={iconName as any}
                  size={28}
                  color={abo.active ? colors.primary : "gray"}
                  style={{ marginRight: 10 }}
                />
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {abo.category}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.text }]}>
                    {new Date(abo.startDate).toLocaleDateString()} →{" "}
                    {new Date(abo.endDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Status */}
              <View
                style={{
                  marginTop: 10,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: statusColor,
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  {statusText}
                </Text>

                <Text
                  style={{
                    color: isExpired ? "gray" : colors.primary,
                    fontWeight: "500",
                    fontSize: 14,
                  }}
                >
                  {isExpired
                    ? "Expiré"
                    : `⏳ ${daysLeft} jour${daysLeft > 1 ? "s" : ""} restants`}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

export default ListeAbonnementScreen;

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
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 13,
    opacity: 0.7,
  },
});
