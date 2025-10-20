// screens/AdminFactureScreen.tsx

import { FactureService } from '@/services/FactureService';
import { Facture } from '@/type/type';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ===================================================================
// 🔹 Component for a single editable invoice item
// ===================================================================
const AdminFactureItem = ({
  facture,
  onUpdate,
}: {
  facture: Facture;
  onUpdate: () => void;
}) => {
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFacture, setCurrentFacture] = useState<Facture>({...facture});

  const handleStatusChange = (newStatus: Facture['etat']) => {
    setCurrentFacture({ ...currentFacture, etat: newStatus });
  };

  const handleItemChange = (
    index: number,
    field: 'quantite' | 'prix',
    value: string
  ) => {
    const updatedItems = [...currentFacture.items];
    const numericValue = parseFloat(value) || 0;
    updatedItems[index] = { ...updatedItems[index], [field]: numericValue };
    setCurrentFacture({ ...currentFacture, items: updatedItems });
  };

  const calculateTotal = () =>
    currentFacture.items.reduce((acc, item) => acc + item.prix * item.quantite, 0);

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const newTotal = calculateTotal();

      // Only update known fields of Facture
      const dataToUpdate: Partial<Facture> = {
        etat: currentFacture.etat,
        items: currentFacture.items,
        total: newTotal,
      };

      const success = await FactureService.updateFacture(facture.id || '', dataToUpdate);

      if (success) {
        Alert.alert('Succès', 'Facture mise à jour.');
        setIsEditing(false);
        onUpdate();
      } else {
        throw new Error('Update failed');
      }
    } catch  {
      Alert.alert('Erreur', 'Impossible de mettre à jour la facture.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStyle = (status: Facture['etat']) => {
    switch (status) {
      case 'payée':
        return { backgroundColor: colors.primary, color: '#fff' };
      case 'annulée':
        return { backgroundColor: '#ef4444', color: '#fff' };
      case 'en attente':
      default:
        return { backgroundColor: '#eab308', color: '#fff' };
    }
  };

  return (
    <View style={styles.itemContainer}>
      {/* Header */}
      <View style={styles.itemHeader}>
        <Text style={styles.factureNumber}>{facture.factureNumber}</Text>
        <Text style={styles.clientName}>{'Client'}</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Ionicons
            name={isEditing ? 'close-circle' : 'create-outline'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.itemBody}>
        <Text style={styles.total}>Total: {calculateTotal().toFixed(2)} $</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusStyle(currentFacture.etat).backgroundColor },
          ]}
        >
          <Text
            style={{ color: getStatusStyle(currentFacture.etat).color, fontWeight: 'bold' }}
          >
            {currentFacture.etat}
          </Text>
        </View>
      </View>

      {/* Editable Section */}
      {isEditing && (
        <View style={styles.editContainer}>
          <Text style={styles.editTitle}>Modifier la Facture</Text>

          {/* Status Buttons */}
          <View style={styles.statusSelector}>
            {(['en attente', 'payée', 'annulée'] as const).map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  { backgroundColor: getStatusStyle(status).backgroundColor },
                  currentFacture.etat === status && styles.selectedStatus,
                ]}
                onPress={() => handleStatusChange(status)}
              >
                <Text style={styles.statusButtonText}>{status}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Items List */}
          {currentFacture.items.map((item, index) => (
            <View key={index} style={styles.editItemRow}>
              <Text style={styles.editItemName}>{item.nom}</Text>
              <TextInput
                style={styles.editInput}
                value={String(item.quantite)}
                onChangeText={text => handleItemChange(index, 'quantite', text)}
                keyboardType="numeric"
                placeholder="Qté"
              />
              <TextInput
                style={styles.editInput}
                value={String(item.prix)}
                onChangeText={text => handleItemChange(index, 'prix', text)}
                keyboardType="numeric"
                placeholder="Prix"
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveChanges}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ===================================================================
// 🔹 Main Admin Screen Component
// ===================================================================
const GererFactureScreen: React.FC = () => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<Facture[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  const fetchAllFactures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await FactureService.getAllFactures();
      setFactures(res);
      setFilteredFactures(res);
    } catch  {
      Alert.alert('Erreur', 'Impossible de récupérer les factures.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllFactures();
  }, [fetchAllFactures]);

  useEffect(() => {
    const filtered = search
      ? factures.filter(f =>
          f.factureNumber.toLowerCase().includes(search.toLowerCase())
        )
      : factures;
    setFilteredFactures(filtered);
  }, [search, factures]);

  if (loading && factures.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>Gérer les Factures</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par numéro de facture..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredFactures}
        keyExtractor={item => item.id ?? item.factureNumber}
        renderItem={({ item }) => (
          <AdminFactureItem facture={item} onUpdate={fetchAllFactures} />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshing={loading}
        onRefresh={fetchAllFactures}
      />
    </SafeAreaView>
  );
};

export default GererFactureScreen;

// ===================================================================
// 🔹 Styles
// ===================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
    color: '#1e293b',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  itemContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  factureNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
  },
  clientName: {
    fontSize: 14,
    color: '#64748b',
  },
  itemBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  editContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 16,
    paddingTop: 16,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#334155',
  },
  statusSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectedStatus: {
    borderWidth: 2,
    borderColor: '#fff',
    opacity: 1,
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  editItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  editItemName: {
    flex: 2,
    fontSize: 14,
    color: '#475569',
  },
  editInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    textAlign: 'center',
    marginLeft: 8,
    backgroundColor: '#fff',
  },
  saveButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
