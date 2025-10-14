import { useAuth } from "@/contexts/AuthContext";
import { getAgentsSanByEventId } from "@/services/AgentScanService";
import { getArticlesByCategory } from "@/services/articleService";
import { FactureService } from "@/services/FactureService";
import { ScanService } from "@/services/ScanService";
import { Facture, souscat } from "@/type/type";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from '@react-navigation/native';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Header from "./components/header";

export default function QrCodeScanScreen() {
  const [data, setData] = useState<Facture | null>(null);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [typeSelected, setTypeSelected] = useState<string>("");
  const [datas, setDatas] = useState<any[]>([]);
  const [id, setId] = useState<string>('');
  const [sousCategorie, setSousCategorie] = useState<string>('');
  const [eligible, setEligible] = useState(false);
  const { colors } = useTheme();
  const { user } = useAuth();

  // Charger les articles dès le montage
  useEffect(() => {
    const getArticlesByCategorie = async () => {
      try {
        const res = await getArticlesByCategory('Événements');
        if (res) setDatas(res);
      } catch (error) {
        console.log("Erreur de chargement :", error);
      }
    };
    getArticlesByCategorie();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const existing = await getAgentsSanByEventId(user?.uid, id);
      if (existing.length > 0) {
        const agent = existing[0];
        if (agent.state !== "non actif") {
          setEligible(true);
        } else {
          Alert.alert("Erreur", "Vous n'êtes pas éligible pour scanner les tickets de cet événement.");
        }
      } else {
        Alert.alert("Erreur", "Enregistrez-vous pour vérification.");
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  // ÉTAPE 1 : Vérification d’éligibilité
  if (!eligible) {
    return (
      <View style={styles.containerCheck}>
        <Header />
        <Text style={[styles.title, { color: colors.text }]}>Vérifiez votre éligibilité</Text>
        <Text style={{ paddingBottom: 20 }}>Assurez-vous d'être autorisé à scanner les tickets.</Text>

        <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
          <Picker
            selectedValue={typeSelected}
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

        {typeSelected === "ballon d'or" && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.label}>Choisissez la sous-catégorie :</Text>
            <View style={[styles.pickerWrapper, { borderColor: colors.primary }]}>
              <Picker
                selectedValue={sousCategorie}
                onValueChange={(itemValue) => setSousCategorie(itemValue)}
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

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Vérification..." : "Vérifier"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ÉTAPE 2 : Scanner
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", color: "#fff" }}>
          Nous avons besoin de votre permission pour accéder à la caméra.
        </Text>
        <Button onPress={requestPermission} title="Autoriser la caméra" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleBarCodeScanned = async (scanningResult: BarcodeScanningResult) => {
    const data = scanningResult?.data;
    if (!data) return;

    setScanned(true);
    setScannedData(data);
    await getFactureById(data);
  };

  const getFactureById = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await FactureService.getFactureById(id);
      if (res) setData(res);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger la facture.");
    } finally {
      setIsLoading(false);
    }
  };

  const createScan = async (uid: string, factureNumber: string) => {
    setIsLoading(true);
    try {
      const fact = await ScanService.getScansByFacture(factureNumber);
      if (fact?.length === 0) {
        const res = await ScanService.createScan({
          factureId: factureNumber,
          uid: uid,
        });
        if (res) Alert.alert("Succès", "Scan effectué avec succès !");
      } else {
        Alert.alert("Erreur", "Ticket déjà scanné !");
      }
    } catch (error) {
      Alert.alert("Erreur", "Erreur lors du scan.");
    } finally {
      setIsLoading(false);
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.switchButton} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Changer de caméra</Text>
          </TouchableOpacity>
        </View>

        {(scanned && !isLoading) && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>QR Code détecté</Text>
            <Text style={styles.overlayData}>N° Facture : {data?.factureNumber || ''}</Text>
            <Text style={[styles.overlayData]}>Etat de la facture: {data?.etat || ''}</Text>
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: colors.primary }]}
              onPress={() => data && createScan(user?.uid, data.factureNumber)}
            >
              <Text style={styles.scanButtonText}>Scanner à nouveau</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={styles.overlay}>
            <Text style={styles.overlayData}>Chargement...</Text>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  containerCheck: { flex: 1, padding: 16, marginTop: 20, paddingBottom: 70 },
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  camera: { flex: 1 },
  buttonContainer: { position: "absolute", bottom: 40, left: 0, right: 0, alignItems: "center" },
  switchButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  text: { fontSize: 18, fontWeight: "600", color: "#fff" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  overlayTitle: { fontSize: 26, fontWeight: "bold", color: "white", marginBottom: 15 },
  overlayData: { fontSize: 16, color: "#ccc", textAlign: "center", marginBottom: 30 },
  scanButton: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25 },
  scanButtonText: { fontSize: 16, color: "white", fontWeight: "600" },
  pickerWrapper: { borderWidth: 1, borderRadius: 10, overflow: "hidden", marginBottom: 20 },
  picker: { height: 50 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 18, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  button: { marginTop: 30, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
