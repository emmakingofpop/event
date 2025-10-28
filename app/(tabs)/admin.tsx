import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
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

type QuickActionButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  onPress?: () => void;
};

type KnownRoutes =
  | "/Postuler"
  | "/ListePostulerScreen"
  | "/VoteScreen"
  | "/MusiqueScreen"
  | "/AgentscanScreen"
  | "/QrCodeScanScreen";

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
  <LinearGradient
    colors={["#6a5be2", "#8e76f0"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.headerGradient}
  >
    <View style={styles.headerContainer}>
      <TouchableOpacity activeOpacity={0.7}>
        <Ionicons name="menu" size={28} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Admin Dashboard</Text>
      <Ionicons name="person-circle-outline" size={28} color="#fff" />
    </View>
  </LinearGradient>
);

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  icon,
  colors,
  onPress,
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
    <LinearGradient
      colors={colors}
      style={styles.actionButton}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.actionButtonIcon}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// ----------------- MAIN SCREEN -----------------
const AdminScreen: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);


  
  if (user?.role !== "admin") {
    return (
      <View style={[styles.container, styles.loaderContainer]}>
        <Text style={styles.loaderText}>Accès refusé. Vous n'êtes pas administrateur.</Text>
      </View>
    );
  }



  if (loading) {
    return (
      <View style={[styles.container, styles.loaderContainer]}>
        <ActivityIndicator size="large" color="#6a5be2" />
        <Text style={styles.loaderText}>Chargement des données...</Text>
      </View>
    );
  }

  // ✅ Typed route buttons (no TS error)
  const topMenuButtons: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: KnownRoutes;
    gradient: [string, string];
  }[] = [
    { label: "Postuler", icon: "briefcase-outline", route: "/Postuler", gradient: ["#6A5BE2", "#8E76F0"] },
    { label: "Liste Postuler", icon: "list", route: "/ListePostulerScreen", gradient: ["#F39C12", "#E67E22"] },
    { label: "Voter", icon: "thumbs-up-outline", route: "/VoteScreen", gradient: ["#4D81E1", "#7A4FE8"] },
    { label: "Musiques", icon: "musical-notes-outline", route: "/MusiqueScreen", gradient: ["#E44D91", "#F37C6C"] },
    { label: "Scan", icon: "scan-outline", route: "/AgentscanScreen", gradient: ["#1E9D8B", "#3FC8A6"] },
    { label: "QR Code", icon: "qr-code-outline", route: "/QrCodeScanScreen", gradient: ["#F39C12", "#E67E22"] },
  ];

  return (
    <LinearGradient colors={["#f3f5ff", "#ffffff"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <Header />

        {/* 🔹 Horizontal Menu with Icons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.topMenuScroll, { marginBottom: -60 }]}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 0 }}
        >
          {topMenuButtons.map((btn, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.85}
              onPress={() => router.push(btn.route)}
              style={styles.menuButtonWrapper}
            >
              <LinearGradient
                colors={btn.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuButton}
              >
                <Ionicons name={btn.icon} size={24} color="#fff" style={{ marginBottom: 6 }} />
                <Text style={styles.menuLabel}>{btn.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 🔹 Quick Actions */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.actionsTitle}>Actions rapides</Text>

          <QuickActionButton
            label="Gérer les Agents Scan"
            icon="people-circle"
            colors={["#4D81E1", "#7A4FE8"]}
            onPress={() => router.push("/GererAgentScanScreen")}
          />
          <QuickActionButton
            label="Gérer les Likes"
            icon="heart-circle"
            colors={["#E44D91", "#F37C6C"]}
            onPress={() => router.push("/GererLikeScreen")}
          />
          <QuickActionButton
            label="Gérer les abonnements"
            icon="settings-outline"
            colors={["#6A5BE2", "#9076E8"]}
            onPress={() => router.push("/GererAbonnement")}
          />
          <QuickActionButton
            label="Gérer les factures"
            icon="document-text-outline"
            colors={["#E84D88", "#E37365"]}
            onPress={() => router.push("/gererFactureScreen")}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 10,
    shadowColor: "#6a5be2",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 10, fontSize: 16, color: "#555" },
  topMenuScroll: { marginVertical: 16 },
  menuButtonWrapper: {
    marginRight: 14,
    borderRadius: 18,
  },
  menuButton: {
    width: 90,
    height: 90,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  menuLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default AdminScreen;
