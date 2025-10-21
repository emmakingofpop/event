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

import { Platform } from "react-native";
import { db, storage } from "./firebaseConfig";

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
) => {
  try {
    let fileUri: string;

    if (Platform.OS === "android") {
      // Android: save to Downloads
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        throw new Error("Permission to access Downloads folder denied");
      }

      // Create file in Downloads
      fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        "audio/mpeg"
      );
    } else {
      // iOS / others: save inside app directory
      const dir = FileSystem.documentDirectory + "musics/";
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      fileUri = dir + fileName;

      // Check if already downloaded
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        return { uri: fileUri, alreadyExists: true };
      }
    }

    // Download to temporary local file first
    const tempUri = FileSystem.documentDirectory + "temp_" + fileName;

    const callback = (downloadProgress: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      if (onProgress) onProgress(progress);
    };

    const downloadResumable = FileSystem.createDownloadResumable(url, tempUri, {}, callback);
    const { uri: localUri } = await downloadResumable.downloadAsync();
    console.log("✅ Finished downloading temporarily to", localUri);

    // Copy content to final location
    const fileContent = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
    await FileSystem.writeAsStringAsync(fileUri, fileContent, { encoding: FileSystem.EncodingType.Base64 });

    // Optional: delete temp file
    await FileSystem.deleteAsync(tempUri);

    return { uri: fileUri, alreadyExists: false };
  } catch (error) {
    console.error("Error downloading music:", error);
    throw error;
  }
},

deletLocally : async (uri:any) => {
  try {
  await FileSystem.deleteAsync(uri);
  console.log("✅ File deleted successfully");
} catch (error) {
  console.error("❌ Error deleting file:", error);
}

},


};

export default MusiqueService;
