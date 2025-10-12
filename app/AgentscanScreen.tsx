import { useAuth } from '@/contexts/AuthContext';
import { getArticlesByCategory } from '@/services/articleService';
import { souscat } from '@/type/type';
import { Picker } from "@react-native-picker/picker";
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  createAgentSan,
  getAgentsSanByEventId,
  updateAgentSan,
} from "../services/AgentScanService";
import Header from './components/header';



const AgentscanScreen = () => {
        const [typeselected, setTypeSelected] = useState<string>("");
        const [datas, setData] = useState<any[]>([]);
        const [id, setId] = useState<string>('');
        const [souscategorie, setSouscategorie] = useState<string>('');
        const [isLoading, setIsLoading] = useState(false);
        const { colors } = useTheme();
        const { user } = useAuth();
      

      
    
      useEffect(() => {
        const getArticlesByCategori = async () => {
          try {
            const res = await getArticlesByCategory('Événements');
            if (res) {
              
              setData(res);
            }
          } catch (error) {
            console.error(error);
          }
        };
        getArticlesByCategori();
      }, []);

      const handleSubmit = async () => {
  if (!user || !user.uid) {
    Alert.alert("Erreur", "Vous devez être connecté pour postuler.");
    return;
  }

  if (!id || !typeselected) {
    Alert.alert("Erreur", "Veuillez sélectionner un événement et un type.");
    return;
  }

  setIsLoading(true);
  try {
    // Vérifie si l’agent existe déjà (même uid + eventId)
    const existing = await getAgentsSanByEventId(user.uid, id);

    if (existing.length > 0) {
      // 🔄 Mettre à jour l'enregistrement existant
      const agent = existing[0];
      if (agent.state !== "no actif") {
        const agentId = agent.id;
        await updateAgentSan(agentId, {
            categorie: souscategorie || typeselected,
            state: "no actif",
        });
        Alert.alert("Succès", "Votre candidature a été mise à jour avec succès !");
      }else{
        Alert.alert("Succès", "Attend l'activation");
      }
    } else {
      // 🆕 Créer un nouvel agent
      await createAgentSan({
        uid: user.uid,
        eventId: id,
        categorie: souscategorie || typeselected,
        state: "no actif",
      });
      Alert.alert("Succès", "Votre candidature a été envoyée avec succès !");
    }
  } catch (error) {
    console.error("Erreur dans handleSubmit:", error);
    Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
  } finally {
    setIsLoading(false);
  }
};


  return (
    
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <Header />
      <Text style={[styles.title, { color: colors.text }]}>Postuler</Text>
      <Text style={{paddingBottom:20}}>Postuler en tant qu’agent de scannage pour un événement</Text>

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

      {typeselected === "ballon d'or" && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Choisissez la sous-catégorie :</Text>
          <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
            <Picker
              selectedValue={souscategorie}
              onValueChange={(itemValue) => setSouscategorie(itemValue)}
              style={styles.picker}
              dropdownIconColor="#fff"
            >
              <Picker.Item label="Sélectionnez" value="" />
              {souscat.map((cat, idx) => (
                <Picker.Item key={idx} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>
      )}


      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Envoi en cours..." : "Postuler"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 20, paddingBottom: 70, maxHeight: '80%' },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#032D23",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  picker: {
    height: 50,
    color: "#032D23",
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 1,
  },
  label: {
    fontSize: 16,
    marginHorizontal: 5,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
  },
  button: {
    marginTop: 30,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default AgentscanScreen;
