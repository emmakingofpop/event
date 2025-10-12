import { useAuth } from '@/contexts/AuthContext';
import { FactureService } from '@/services/FactureService';
import { Facture } from '@/type/type';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FactureUI from './components/Facture';
import Header from './components/header';

const FactureScreen: React.FC = () => {
  const [data, setData] = useState<Facture[]>([]);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState<Facture[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
    const { colors } = useTheme();

  const fetchFactures = async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      const res = await FactureService.getFacturesByUser(uid);
      setData(res);
      setFilteredData(res);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchFactures(user.uid);
  }, [user]);

  // Filtrage dynamique selon le texte
  useEffect(() => {
    if (!search) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(f =>
        f.factureNumber.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [search, data]);

  return (
    <SafeAreaView style={styles.conteneur}>
      <Header />

      {/* Input + bouton Refresh */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.inputRecherche}
          placeholder="Rechercher par numéro de facture"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={[styles.btnRefresh,{backgroundColor: colors.primary,}]}
          onPress={() => user?.uid && fetchFactures(user.uid)}
        >
          <Text style={styles.textBtn}>Rafraîchir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.factureNumber} // ou item.id
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <FactureUI fact={item} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshing={loading}
        onRefresh={() => user?.uid && fetchFactures(user.uid)}
      />
    </SafeAreaView>
  );
};

export default FactureScreen;

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    padding: 5,
    backgroundColor: '#f8fafc',
  },
   itemContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1', // gris clair pour la bordure
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff', // optionnel pour mieux voir la bordure
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputRecherche: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  btnRefresh: {
    marginLeft: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  textBtn: {
    color: '#fff',
    fontWeight: '600',
  },
});
