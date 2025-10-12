import { addDoc, collection, DocumentData, getDocs, orderBy, query } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, uploadBytesResumable } from "firebase/storage";
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
  // uploadMusic function remains the same
  uploadMusic: async (file: { uri: string; name: string }, titre: string, description: string) => {
    const response = await fetch(file.uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `musics/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);

    await addDoc(collection(db, 'musics'), {
      titre,
      description,
      fileName: file.name,
      url: downloadURL,
      createdAt: new Date(),
    });

    return downloadURL;
  },

  // getMusics function is now adapted for the UI
  getMusics: async (): Promise<Song[]> => {
    const q = query(collection(db, "musics"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    // Map the Firestore document directly to the Song interface
    return snapshot.docs.map((doc) => {
      const data: DocumentData = doc.data();
      return {
        id: doc.id,
        titre: data.titre || 'No Title',
        url: data.url,
        description: data.description || '',
        // --- This is the logic moved from the component ---
        artist: data.description || 'Unknown Artist',
        albumArtUrl: `https://picsum.photos/seed/${doc.id}/200`, // Placeholder art
      };
    });
  },

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
          const progress =
            snapshot.bytesTransferred / snapshot.totalBytes;
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


};

export default MusiqueService;