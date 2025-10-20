import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ----------------- TYPES -----------------
type Abonnements = { active: number; expired: number };
type Tickets = { paid: number; pending: number; canceled: number };
type DashboardData = {
  users: number;
  abonnements: Abonnements;
  tickets: Tickets;
  factures: number;
};

type DashboardCardProps = {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
};

type QuickActionButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string]; // fixed TS tuple type
  onPress?: () => void;
};

// ----------------- MOCK API -----------------
const fetchDashboardData = async (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        users: 128,
        abonnements: { active: 45, expired: 12 },
        tickets: { paid: 76, pending: 9, canceled: 3 },
        factures: 33,
      });
    }, 1500);
  });
};

// ----------------- COMPONENTS -----------------
const Header: React.FC = () => (
  <View style={styles.headerContainer}>
    <TouchableOpacity>
      <Ionicons name="menu" size={28} color="#333" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Admin</Text>
    <View style={{ width: 28 }} />
  </View>
);

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.cardTouchable}>
    <View style={styles.cardContainer}>
      <View style={styles.cardIconContainer}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  </TouchableOpacity>
);

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ label, icon, colors, onPress }) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
    <LinearGradient
      colors={colors} // TS-safe as [string, string]
      style={styles.actionButton}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.actionButtonIcon}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// ----------------- MAIN SCREEN -----------------
const AdminScreen: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loaderContainer]}>
        <ActivityIndicator size="large" color="#6a5be2" />
        <Text style={styles.loaderText}>Chargement des données...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        

        {/* 🔹 Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Actions rapides</Text>

          <QuickActionButton
            label="Gérer les Agents Scan"
            icon="people-circle"
            colors={["#4D81E1", "#7A4FE8"]}
            onPress={() => router.push('/GererAgentScanScreen')}
          />
          <QuickActionButton
            label="Gérer les Likes"
            icon="heart-circle"
            colors={["#4D81E1", "#7A4FE8"]}
            onPress={() => router.push('/GererLikeScreen')}
          />

          <QuickActionButton
            label="Gérer les abonnements"
            icon="settings-outline"
            colors={["#6A5BE2", "#9076E8"]}
            onPress={() => router.push('/GererAbonnement')}
          />

          <QuickActionButton
            label="Gérer les factures"
            icon="document-text-outline"
            colors={["#E84D88", "#E37365"]}
            onPress={() => router.push('/gererFactureScreen')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical:20},
  loaderContainer: { justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 10, fontSize: 16, color: "#555" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  headerContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#6a5be2" },
  dashboardTitle: { fontSize: 26, fontWeight: "bold", color: "#1A1A1A", marginTop: 10, marginBottom: 25 },
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cardTouchable: { width: "48%", marginBottom: 16 },
  cardContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.05)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 14, color: "#8A8A8A", marginBottom: 5 },
  cardValue: { fontSize: 24, fontWeight: "bold" },
  actionsSection: { marginTop: 20 },
  actionsTitle: { fontSize: 20, fontWeight: "bold", color: "#1A1A1A", marginBottom: 15 },
  actionButton: { flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  actionButtonIcon: { backgroundColor: "rgba(255, 255, 255, 0.2)", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 15 },
  actionButtonLabel: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF" },
});

export default AdminScreen;
