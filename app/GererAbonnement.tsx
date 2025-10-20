import { useAuth } from "@/contexts/AuthContext";
import {
    Abonnement,
    activateAbonnementByNumero,
    deactivateAbonnementByNumero,
    deleteAbonnementByNumero,
    getAllAbonnements,
} from "@/services/AbonnementServices";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
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

const GererAbonnement: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");

  const fetchAbonnements = async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await getAllAbonnements();
      setAbonnements(data);
    } catch {
      Alert.alert("Erreur", "Impossible de récupérer les abonnements");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAbonnements();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAbonnements();
  };

  const handleActivate = async (numero: string) => {
    try {
      await activateAbonnementByNumero(numero);
      Alert.alert("Succès", `Abonnement ${numero} activé`);
      fetchAbonnements();
    } catch {
      Alert.alert("Erreur", "Impossible d'activer l'abonnement");
    }
  };

  const handleDeactivate = async (numero: string) => {
    try {
      await deactivateAbonnementByNumero(numero);
      Alert.alert("Succès", `Abonnement ${numero} désactivé`);
      fetchAbonnements();
    } catch {
      Alert.alert("Erreur", "Impossible de désactiver l'abonnement");
    }
  };

  const handleDelete = async (numero: string) => {
    Alert.alert(
      "Confirmer",
      `Voulez-vous vraiment supprimer l'abonnement ${numero} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAbonnementByNumero(numero);
              Alert.alert("Supprimé", `Abonnement ${numero} supprimé`);
              fetchAbonnements();
            } catch {
              Alert.alert("Erreur", "Impossible de supprimer l'abonnement");
            }
          },
        },
      ]
    );
  };

  const calculateRemainingDays = (endDateString: string) => {
    const now = new Date();
    const endDate = new Date(endDateString);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredAbonnements = abonnements.filter((abo) =>
    (abo.numero ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Text style={[styles.title, { color: colors.text, flex: 1 }]}>Tous les abonnements</Text>
        <TouchableOpacity onPress={handleRefresh} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Filtrer par numéro..."
        placeholderTextColor="gray"
        value={filter}
        onChangeText={setFilter}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <FlatList
        data={filteredAbonnements}
        keyExtractor={(item) => item.numero ?? item.id!}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item: abo }) => {
          const daysLeft = calculateRemainingDays(abo.endDate);
          const iconName = categoryIcons[abo.category] || "pricetag";
          const isExpired = daysLeft <= 0;

          return (
            <View
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name={iconName as any}
                  size={28}
                  color={abo.active ? colors.primary : "gray"}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {abo.category} ({abo.numero})
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.text }]}>
                    {new Date(abo.startDate).toLocaleDateString()} →{" "}
                    {new Date(abo.endDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>

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
                    color: abo.active ? "#4CAF50" : "#F44336",
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  {abo.active ? "✅ Actif" : "❌ Inactif"}
                </Text>

                <Text
                  style={{
                    color: isExpired ? "gray" : colors.primary,
                    fontWeight: "500",
                    fontSize: 14,
                  }}
                >
                  {isExpired ? "Expiré" : `⏳ ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: "row", marginTop: 10, justifyContent: "space-between" }}>
                {!abo.active && !isExpired && (
                  <TouchableOpacity
                    style={[styles.activateButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleActivate(abo.numero)}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>Activer</Text>
                  </TouchableOpacity>
                )}

                {abo.active && !isExpired && (
                  <TouchableOpacity
                    style={[styles.deactivateButton, { backgroundColor: "#F44336" }]}
                    onPress={() => handleDeactivate(abo.numero)}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>Désactiver</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: "#9E9E9E" }]}
                  onPress={() => handleDelete(abo.numero)}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

export default GererAbonnement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 28,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
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
  activateButton: {
    flex: 1,
    marginRight: 4,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  deactivateButton: {
    flex: 1,
    marginRight: 4,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    zIndex: 1,
  },
});
