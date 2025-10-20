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

 downloadMusicLocally: async (
  url: string,
  fileName: string,
  onProgress?: (progress: number) => void
) => {
  try {
    // Classic API folder
    const dir = FileSystem.documentDirectory + "musics/";
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

    const fileUri = dir + fileName;

    // Check if already downloaded
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      return { uri: fileUri, alreadyExists: true };
    }

    // Progress callback
    const callback = (downloadProgress: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      if (onProgress) onProgress(progress);
    };

    // Create resumable download
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      callback
    );

    const { uri } = await downloadResumable.downloadAsync();
    console.log("✅ Finished downloading to", uri);

    return { uri, alreadyExists: false };
  } catch (error) {
    console.error("Error downloading music:", error);
    throw error;
  }
},


};

export default MusiqueService;
