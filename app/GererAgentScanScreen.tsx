import { useAuth } from '@/contexts/AuthContext';
import { getAgentsSan, updateAgentSan } from "@/services/AgentScanService";
import { getArticlesByCategory } from '@/services/articleService';
import { getProfilesByUids } from '@/services/profileService';
import { souscat } from '@/type/type';
import { Picker } from "@react-native-picker/picker";
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Header from './components/header';

const GererAgentScanScreen = () => {
  const [typeselected, setTypeSelected] = useState<string>("");
  const [datas, setData] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<any[]>([]); // ✅ filtered by souscategorie
  const [profiles, setProfiles] = useState<any[]>([]);
  const [id, setId] = useState<string>('');
  const [souscategorie, setSouscategorie] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const { colors } = useTheme();
  const { user } = useAuth();

  // 🔹 Fetch categories
  useEffect(() => {
    const getArticlesByCategori = async () => {
      try {
        const res = await getArticlesByCategory('Événements');
        if (res) setData(res);
      } catch {}
    };
    getArticlesByCategori();
  }, []);

  // 🔹 Fetch agents by selected category
  useEffect(() => {
    if (id) getAgentsSans(id);
  }, [id]);

  // 🔹 Fetch profiles after agents are loaded
  useEffect(() => {
    if (agents.length > 0) {
      const uids = agents.map(a => a.uid);
      getProfileByUserids(uids);
    }
  }, [agents]);

  // 🔹 Filter agents by souscategorie when it changes
  useEffect(() => {
    if (!souscategorie) {
      setFilteredAgents(agents);
    } else {
      const filtered = agents.filter(
        a => a.categorie === souscategorie
      );
      setFilteredAgents(filtered);
    }
  }, [souscategorie, agents]);

  const getAgentsSans = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await getAgentsSan(id);
      if (res) {
        setAgents(res);
        setFilteredAgents(res); // initialize filtered list
      }
    } catch {
      Alert.alert("Erreur", "Impossible de récupérer les agents.");
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileByUserids = async (uids: string[]) => {
    try {
      const res = await getProfilesByUids(uids);
      if (res) setProfiles(res);
    } catch {
      Alert.alert("Erreur", "Impossible de récupérer les profils.");
    }
  };

  const handleChangeState = async (agentId: string, newState: string) => {
    try {
      await updateAgentSan(agentId, { state: newState });
      setAgents(prev =>
        prev.map(a => (a.id === agentId ? { ...a, state: newState } : a))
      );
      Alert.alert("Succès", `L'état a été mis à jour en ${newState}`);
    } catch {
      Alert.alert("Erreur", "Impossible de mettre à jour l'état.");
    }
  };

  // 🔹 Filter by "state" (actif / no actif)
  const filteredByState =
    filter === "all"
      ? filteredAgents
      : filteredAgents.filter(a => a.state === filter);

  const mergedAgents = filteredByState.map(agent => ({
    ...agent,
    profile: profiles.find(p => p.uid === agent.uid)
  }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1,paddingHorizontal:10,paddingVertical:20 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        automaticallyAdjustKeyboardInsets={true}
      >
        <Header />
        <Text style={[styles.title, { color: colors.text }]}>Liste des Agents</Text>
        <Text style={{ paddingBottom: 20 }}>Sélectionnez un événement</Text>

        {/* Event Picker */}
        <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
          <Picker
            selectedValue={typeselected}
            onValueChange={(itemValue) => {
              const [style, idx] = itemValue.split('|');
              setTypeSelected(style);
              setId(idx);
            }}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Sélectionnez le type" value="" />
            {datas.map((cat, idx) => (
              <Picker.Item
                key={idx}
                label={cat.title}
                value={`${cat.style}|${cat.id}`}
              />
            ))}
          </Picker>
        </View>

        {/* Sous-catégorie Picker */}
        {typeselected === "ballon d'or" && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Choisissez la sous-catégorie :</Text>
            <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
              <Picker
                selectedValue={souscategorie}
                onValueChange={(itemValue) => setSouscategorie(itemValue)}
                style={styles.picker}
                dropdownIconColor="#fff"
              >
                <Picker.Item label="Toutes" value="" />
                {souscat.map((cat, idx) => (
                  <Picker.Item key={idx} label={cat.title} value={cat.title} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Filter by state */}
        <Text style={[styles.label, { marginTop: 10 }]}>Filtrer par état :</Text>
        <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
          <Picker
            selectedValue={filter}
            onValueChange={(v) => setFilter(v)}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Tous" value="all" />
            <Picker.Item label="Actifs" value="actif" />
            <Picker.Item label="Non Actifs" value="no actif" />
          </Picker>
        </View>

        {/* Loading indicator */}
        {isLoading && (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
        )}

        {/* Agents list */}
        {!isLoading && mergedAgents.map((agent, idx) => (
          <View key={idx} style={styles.agentCard}>
            <View style={styles.agentHeader}>
              {agent.profile?.images?.[0] ? (
                <Image source={{ uri: agent.profile.images[0] }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ color: "#fff" }}>{agent.profile?.fullName?.[0] || "?"}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>{agent.profile?.fullName || "Inconnu"}</Text>
                <Text style={styles.agentSub}>
                  {agent.categorie} | {agent.profile?.age} ans
                </Text>
              </View>
            </View>

            <View style={styles.stateRow}>
              <Text style={styles.stateText}>État : {agent.state}</Text>
              <TouchableOpacity
                style={[
                  styles.stateButton,
                  { backgroundColor: agent.state === "actif" ? "#2ecc71" : "#e74c3c" },
                ]}
                onPress={() =>
                  handleChangeState(agent.id, agent.state === "actif" ? "no actif" : "actif")
                }
              >
                <Text style={styles.stateButtonText}>
                  {agent.state === "actif" ? "Désactiver" : "Activer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { padding: 16, paddingBottom: 80 },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  picker: { height: 50, color: "#032D23" },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  agentCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  agentHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 55, height: 55, borderRadius: 30, marginRight: 10 },
  avatarPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  agentName: { fontSize: 16, fontWeight: "700" },
  agentSub: { fontSize: 13, color: "#aaa" },
  stateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stateText: { fontSize: 14, fontWeight: "600" },
  stateButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  stateButtonText: { color: "#fff", fontWeight: "600" },
});

export default GererAgentScanScreen;
