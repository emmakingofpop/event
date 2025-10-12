import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Header from '../components/header';

export default function HomeScreen() {  
  const { colors } = useTheme();
  const { user,setCat,sendNotification  } = useAuth();
  // Catégories basées sur ton document
  const categories = [
    { name: 'Événements', icon: 'calendar' },
    { name: 'Shopping', icon: 'cart' },
    { name: 'Transport', icon: 'car' },
    { name: 'Réservation', icon: 'bed' },
    { name: 'Livraison', icon: 'bicycle' },
    { name: 'Rencontre', icon: 'heart' },
  ];

  // Exemple de données (futur: à récupérer depuis backend / Firestore)
  const items = [
    { name: 'Concert Gospel', price: '15$', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaRbFjgr9vxlF98DrAO0zFED-z8SZecw0-ww&s' },
    { name: 'Chemise Homme', price: '20$', image: 'https://lechemiseur.fr/data/lechemiseur/chemise-homme/fiche-produit-pleine-page/fiche-produit-pleine-page-v4/LE-CHEMISEUR-chemise-homme-blanche-Thomas-Mason-luxe-UW11-carre.jpg' },
    { name: 'Taxi Moto', price: '1.5$/km', image: 'https://s.rfi.fr/media/display/ded235a8-0fac-11ea-ae72-005056a99247/w:1024/p:16x9/img_9428_0_0.jpg' },
  ];

  const setrouter = (cat:string) => {
    // Navigation logic here
    setCat(cat);
    router.push("/ListePoste")
  }
  const handlePress = () => {
    sendNotification("🔔 LEVRAI", "This is a global test notification!", {
      screen: "ListePoste",
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {/* Header */}
      <Header />

      {/* <Button title="Send Notification" onPress={handlePress} /> */}

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          placeholder="Rechercher..."
          placeholderTextColor={colors.text}
          style={[styles.searchInput, { color: colors.text }]}
        />
        <Ionicons name="search" size={22} color={colors.primary} />
      </View>

      {/* bouton ajout miss et ajout balon d'or */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/Postuler")}
        >
          <Text>Postuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/VoteScreen")}
        >
          <Text>Voter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/MusiqueScreen")}
        >
          <Text>Import Musiques</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/AgentscanScreen")}
        >
          <Text>Agent Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/QrCodeScanScreen")}
        >
          <Text>Qr Code Scan</Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Catégories */}
        <View style={styles.categories}>
          {categories.map((cat, index) => (
            <TouchableOpacity key={index} style={[styles.categoryButton, { backgroundColor: colors.card }]}
              onPress={() => setrouter(cat.name)}
            >
              <Ionicons name={cat.icon as any} size={24} color={colors.primary} />
              <Text style={{ fontSize: 12, color: colors.text, marginTop: 4 }}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section : Produits / Services */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>À découvrir</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {items.map((item, index) => (
              <View key={index} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Image
                  source={{ uri: item.image }}
                  style={{ width: 170, height: 120, borderRadius: 16 }}
                />
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardPrice, { color: colors.text }]}>{item.price}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 20,paddingBottom: 70,maxHeight:'80%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent:'space-between',marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', marginLeft: 8 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    height: 50,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 16 },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryButton: {
    width: '30%',
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  card: {
    borderRadius: 20,
    marginRight: 16,
    padding: 12,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  cardPrice: { fontSize: 14, marginTop: 4 },
  btn: {paddingVertical:4,paddingHorizontal:8,borderRadius: 16,
    alignItems: 'center',
    margin: 5,}
});
