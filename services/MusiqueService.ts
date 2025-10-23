// services/MusiqueService.ts

import * as FileSystem from "expo-file-system/legacy";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
  orderBy,
  query
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import * as MediaLibrary from 'expo-media-library';
import { Alert } from "react-native";
import { db, storage } from "./firebaseConfig";


/**
 * Downloads a music file to the user's visible Music/levrai folder.
 * @param url - Remote MP3 file URL
 * @param fileName - The desired file name
 * @param onProgress - Optional callback for download progress (0–1)
 * @returns { uri, alreadyExists }
 */

export interface Song {
  id: string;
  titre: string;
  url: string;
  description?: string;
  artist: string;
  albumArtUrl: string;
}



const MusiqueService = {
  // Upload with progress (unchanged)
  uploadMusicWithProgress: async (
    file: { uri: string; name: string },
    titre: string,
    description: string,
    onProgress: (progress: number) => void
  ) => {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `musics/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = snapshot.bytesTransferred / snapshot.totalBytes;
          onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(storageRef);
          await addDoc(collection(db, "musics"), {
            titre,
            description,
            fileName: file.name,
            url: downloadURL,
            createdAt: new Date(),
          });
          resolve(downloadURL);
        }
      );
    });
  },

  // Fetch musics
  getMusics: async (): Promise<Song[]> => {
    const q = query(collection(db, "musics"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data: DocumentData = docSnap.data();
      return {
        id: docSnap.id,
        titre: data.titre || "No Title",
        url: data.url,
        description: data.description || "",
        artist: data.description || "Unknown Artist",
        albumArtUrl: `https://picsum.photos/seed/${docSnap.id}/200`,
      };
    });
  },


  // Delete from Firestore + Storage
  deleteMusic: async (id: string, fileUrl: string) => {
    try {
      // Delete Firestore document
      const docRef = doc(db, "musics", id);
      await deleteDoc(docRef);

      // Delete from Storage — extract path from download URL
      const path = decodeURIComponent(fileUrl.split("/o/")[1].split("?")[0]);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);

      return true;
    } catch (error) {
      console.error("Error deleting music:", error);
      throw error;
    }
  },

 // Download using the new File/Directory object API with smart logic
 
 downloadMusicLocally : async (
  url: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<{ uri: string; alreadyExists: boolean }> => {
  
  const TELECHARGEMENT_DIR = `${FileSystem.documentDirectory}downloads/`;
  const fileUri = `${TELECHARGEMENT_DIR}${fileName}`;
  const NOM_ALBUM = "levrai"; // Nom d'album centralisé

  // 🤝 Helper : Affiche une boîte de dialogue de confirmation qui renvoie une Promise.
  const confirmerEcrasement = (uri: string): Promise<boolean> =>
    new Promise(resolve => {
      Alert.alert(
        "Confirmation",
        "Ce fichier existe déjà. Voulez-vous vraiment le télécharger à nouveau  ?",
        [
          { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Oui",
            onPress: async () => {
              try {
                // Supprimer l'ancien fichier avant de lancer le nouveau téléchargement
                await MusiqueService.deletLocally(uri); 
                resolve(true);
              } catch  {
                resolve(false); // Annuler si la suppression échoue
              }
            }
          }
        ],
        { cancelable: false }
      );
    });

  // --- Début de la Logique de la Fonction ---
  try {
    // 1️⃣ Demander la permission
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Veuillez autoriser l'accès au stockage pour le téléchargement.");
      throw new Error("Permission denied");
    }

    // 2️⃣ Préparer le répertoire et vérifier l'existence du fichier
    await FileSystem.makeDirectoryAsync(TELECHARGEMENT_DIR, { intermediates: true });

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      console.log("⚠️ Le fichier existe déjà localement. Demande de confirmation...");
      
      const doitEtreEcrasé = await confirmerEcrasement(fileUri);
      
      if (!doitEtreEcrasé) {
        // L'utilisateur a annulé.
        console.log("❌ Téléchargement annulé par l'utilisateur.");
        return { uri: '', alreadyExists: true }; 
      }
      // Si `doitEtreEcrasé` est `true`, `MusiqueService.deletLocally(fileUri)` a déjà été appelé.
    }

    // 3️⃣ Démarrer le téléchargement
    const callback = (downloadProgress: {
      totalBytesWritten: number;
      totalBytesExpectedToWrite: number;
    }) => {
      if (onProgress) {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        onProgress(progress);
      }
    };

    console.log("⬇️ Téléchargement en cours :", fileName);
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      callback
    );

    const result = await downloadResumable.downloadAsync();
    
    if (!result?.uri) {
        // Nettoyer le fichier partiellement téléchargé si l'opération a échoué
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        throw new Error("Le téléchargement a échoué ou a été interrompu.");
    }

    // 4️⃣ Enregistrer dans la MediaLibrary
    let album = await MediaLibrary.getAlbumAsync(NOM_ALBUM);
    const asset = await MediaLibrary.createAssetAsync(result.uri);

    if (!album) {
      // Créer l'album s'il n'existe pas
      album = await MediaLibrary.createAlbumAsync(NOM_ALBUM, asset, false);
      console.log(`📁 Album '${NOM_ALBUM}' créé.`);
    } else {
      // Ajouter l'asset à l'album existant
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }

    // ✅ Show simple alert instead of modal
    Alert.alert(
      'Téléchargement Terminé',
      `La musique a été téléchargée avec succès !`,
      [{ text: 'OK' }]
    );
    return { uri: asset.uri, alreadyExists: false };

  } catch (error) {
    console.error("Une erreur s'est produite pendant le processus de téléchargement :", error);
    // Retourner un objet d'échec par défaut
    return { uri: '', alreadyExists: false };
  }
},
 
/**
 * Delete locally stored file by URI
 */
deletLocally : async (uri: string) => {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.error("❌ Error deleting file:", error);
  }
},




};

export default MusiqueService;
