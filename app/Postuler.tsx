import { useAuth } from '@/contexts/AuthContext';
import { getArticlesByCategory } from '@/services/articleService';
import { souscat } from '@/type/type';
import { Picker } from "@react-native-picker/picker";
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PostulerService } from '../services/postulerService';
import Header from './components/header';

const Postuler = () => {
  const [typeselected, setTypeSelected] = useState<string>("");
  const [datas, setData] = useState<any[]>([]);
  const [id, setId] = useState<string>('');
  const [souscategorie, setSouscategorie] = useState<string>('');
  const [numero, setNumero] = useState<string>(''); // ✅ Nouveau champ numéro
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();
  const { user } = useAuth();



  useEffect(() => {
    const getArticlesByCategori = async () => {
      try {
        const res = await getArticlesByCategory('Événements');
        if (res) {
          const data = res.filter(
            (cat: any) =>
              cat.style === 'concour miss' || cat.style === "ballon d'or"
          );
          setData(data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    getArticlesByCategori();
  }, []);

  const handleSubmit = async () => {
    if (!typeselected) {
      Alert.alert("Attention", "Veuillez sélectionner un type avant de postuler.");
      return;
    }
    if (!numero.trim()) {
      Alert.alert("Attention", "Veuillez entrer votre numéro de candidat.");
      return;
    }

    try {
      setIsLoading(true);

      const uid = user?.uid;
      if (!uid) {
        Alert.alert("Erreur", "Utilisateur non connecté.");
        return;
      }

      // ✅ Données du candidat
      const postulerData = {
        uid,
        eventId: id,
        category: souscategorie || typeselected,
        numero, // ✅ champ ajouté
      };

      // Vérifier si une candidature existe déjà
      const existing = await PostulerService.getPostulersByUid(uid);
      const duplicate = existing.find(p => p.eventId === id);

      if (duplicate) {
        await PostulerService.updatePostuler(duplicate.id!, postulerData);
        Alert.alert("Succès 🎉", `Votre candidature pour "${typeselected}" a été mise à jour !`);
      } else {
        await PostulerService.createPostuler(postulerData);
        Alert.alert("Succès 🎉", `Votre candidature pour "${typeselected}" a été soumise avec succès !`);
      }

      // Réinitialiser les champs
      setTypeSelected("");
      setSouscategorie("");
      setNumero("");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erreur", error.message || "Une erreur est survenue lors de la soumission.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <Header />
      <Text style={[styles.title, { color: colors.text }]}>Postuler</Text>

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
                <Picker.Item key={idx} label={cat.title} value={cat.title} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* ✅ Champ numéro du candidat */}
      <View style={{ marginTop: 20 }}>
        <Text style={styles.label}>Numéro du candidat :</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.primary, color: colors.text }]}
          placeholder="Entrez votre numéro"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={numero}
          onChangeText={setNumero}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Envoi en cours..." : "Publier"}
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

export default Postuler;
