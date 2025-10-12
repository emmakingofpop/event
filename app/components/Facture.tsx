import { Facture, FactureItem } from '@/type/type';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import DynamicQRCode from './DynamicQRCode';


type Props = {
  fact : Facture;
}

const FactureUI: React.FC<Props> = ({ fact }) => {
  const total = fact?.items.reduce((somme, item) => somme + item.prix * item.quantite, 0);

  

  const renderItem = ({ item }: { item: FactureItem }) => (
    <View style={styles.ligneArticle}>
      <Text style={styles.nomArticle}>{item.nom}</Text>
      <Text style={styles.quantiteArticle}>x{item.quantite}</Text>
      <Text style={styles.prixArticle}>{(item.prix * item.quantite).toFixed(2)} $</Text>
    </View>
  );

  return (
    <View style={styles.conteneur}>
      {/* En-tête */}
      <Text style={styles.titre}>Facture</Text>
      <Text style={styles.sousTitre}>LEVRAI S.A.R.L</Text>
      <View style={{paddingBottom:10,flexDirection:'row',justifyContent:'space-between'}}>
        <Text> Facture N* : {fact?.factureNumber}</Text>
        <Text style={{color: fact?.etat !=="payée" ? 'red': 'green'}}>{fact?.etat}</Text>
      </View>

      {/* Liste des articles */}
      <FlatList
        data={fact?.items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.ligneEntete}>
            <Text style={[styles.texteEntete, { flex: 2 }]}>Description</Text>
            <Text style={[styles.texteEntete, { flex: 1 }]}>Qté</Text>
            <Text style={[styles.texteEntete, { flex: 1, textAlign: 'right' }]}>Total</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.pied}>
            <View style={styles.separateur} />
            <View style={styles.ligneTotal}>
              <Text style={styles.libelleTotal}>Total</Text>
              <Text style={styles.montantTotal}>{total.toFixed(2)} $</Text>
            </View>

            {/* QR Code pour paiement ou vérification */}
            <View style={styles.zoneQR}>
              <DynamicQRCode value={fact?.id || ''} />
              <Text style={styles.labelQR}>Scannez pour vérifier ou payer</Text>
            </View>
          </View>
        }
      />
    </View>
  );
};

export default FactureUI;

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc', // gris clair
  },
  titre: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  sousTitre: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  ligneEntete: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  texteEntete: {
    fontWeight: '600',
    color: '#334155',
  },
  ligneArticle: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  nomArticle: {
    flex: 2,
    fontSize: 15,
    color: '#1e293b',
  },
  quantiteArticle: {
    flex: 1,
    textAlign: 'center',
    color: '#475569',
  },
  prixArticle: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
    color: '#0f172a',
  },
  pied: {
    marginTop: 20,
  },
  separateur: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 10,
  },
  ligneTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  libelleTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  montantTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  zoneQR: {
    marginTop: 30,
    alignItems: 'center',
  },
  labelQR: {
    marginTop: 10,
    color: '#64748b',
  },
});
