import { useAuth } from '@/contexts/AuthContext';
import { FactureService } from '@/services/FactureService';
import { tel } from '@/type/type';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '@react-navigation/native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing'; // NOUVEAU: Pour simuler l'ouverture/le partage du fichier
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  ListRenderItemInfo,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import * as Progress from 'react-native-progress'; // NOUVEAU: Pour l'affichage de la barre de progression
import { checkActiveAbonnement } from '../../services/AbonnementServices';
import MusiqueService from '../../services/MusiqueService';
import Header from '../components/header';

interface Song {
  id: string | number;
  titre: string;
  url: string;
  description?: string;
  artist: string;
  albumArtUrl: string;
}

// Interface for tracking download status
interface DownloadStatus {
  isDownloading: boolean;
  progress: number; // 0 to 1
  isDownloaded: boolean;
}

// --- NOUVEAU COMPOSANT : MODALE DE SUCCÈS DE TÉLÉCHARGEMENT ---
interface DownloadSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    musicTitle: string;
    filePath: string | null;
}

const DownloadSuccessModal: React.FC<DownloadSuccessModalProps> = ({ visible, onClose, musicTitle, filePath }) => {
    
    // Simuler l'ouverture du fichier (en réalité, cela utilise l'API de partage d'Expo)
    const handleOpenFile = async () => {
        if (filePath && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(filePath);
        } else {
            Alert.alert("Action non disponible", "Le partage de fichiers n'est pas supporté sur cet appareil ou le chemin du fichier est introuvable.");
        }
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={modalStyles.centeredView}>
                <View style={modalStyles.modalView}>
                    <Ionicons name="cloud-done-outline" size={60} color="#4CAF50" />
                    <Text style={modalStyles.modalTitle}>Téléchargement Terminé !</Text>
                    <Text style={modalStyles.modalText}>
                        La musique {musicTitle} a été enregistrée. Vous pouvez l‘écouter hors ligne.
                    </Text>
                    
                    <View style={modalStyles.buttonContainer}>
                        <TouchableOpacity
                            style={[modalStyles.button, { backgroundColor: '#2196F3', marginRight: 10 }]}
                            onPress={handleOpenFile}
                        >
                            <Text style={modalStyles.buttonText}>Écouter</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[modalStyles.button, { backgroundColor: '#f44336' }]}
                            onPress={onClose}
                        >
                            <Text style={modalStyles.buttonText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
// --- FIN MODALE ---


const Play = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [musics, setMusics] = useState<Song[]>([]);
  const [filteredMusics, setFilteredMusics] = useState<Song[]>([]);
  const [currentMusic, setCurrentMusic] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveAbonnement, setHasActiveAbonnement] = useState(false);
  
  const [downloadStatuses, setDownloadStatuses] = useState<Map<string | number, DownloadStatus>>(new Map());

  // NOUVEAU ÉTAT: Pour la modale de succès
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{ title: string, path: string | null }>({ title: '', path: null });

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus | null>(null);


  useEffect(() => {
    checkAbonnementAndLoad()
  
  }, [])
  

  // ... (checkAbonnementAndLoad, onPlaybackStatusUpdate, loadMusics, handleRefresh, handleSearch are unchanged)

  const checkAbonnementAndLoad = async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      const active = await checkActiveAbonnement(user.uid, 'Streaming');
      setHasActiveAbonnement(active);

      if (active) {
        await loadMusics();
      }
    } catch {
      Alert.alert('Erreur', "Impossible de vérifier l'abonnement.");
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPlaybackStatus(status);
      if (status.didJustFinish) handleNext();
    } else {
      setPlaybackStatus(null);
      setIsPlaying(false);
    }
  };

  const loadMusics = async () => {
    try {
      setIsLoading(true);
      const data = await MusiqueService.getMusics();
      const formattedData: Song[] = data.map((song: any) => ({
        ...song,
        artist: song.description || 'Artiste inconnu',
        albumArtUrl: `https://picsum.photos/seed/${song.id}/200`,
      }));
      setMusics(formattedData);
      setFilteredMusics(formattedData);
      if (formattedData.length > 0 && !currentMusic) setCurrentMusic(formattedData[0]);

    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMusics();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredMusics(musics);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = musics.filter(
        (m) =>
          m.titre.toLowerCase().includes(lowerText) ||
          m.artist.toLowerCase().includes(lowerText)
      );
      setFilteredMusics(filtered);
    }
  };

  const playMusicWithAbonnementCheck = async (music: Song) => {
    try {
      if (!user?.uid) {
        Alert.alert('⚠️', 'Utilisateur non connecté');
        return;
      }

      const hasActive = await checkActiveAbonnement(user.uid, 'Streaming');
      if (!hasActive) {
        Alert.alert('Abonnement requis', 'Vous devez avoir un abonnement actif pour écouter la musique.');
        return;
      }

      await playMusic(music);
    } catch  {
      Alert.alert('Erreur', "Impossible de vérifier l'abonnement.");
    }
  };

  const playMusic = async (music: Song) => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && currentMusic?.id === music.id) {
          isPlaying ? await soundRef.current.pauseAsync() : await soundRef.current.playAsync();
          setIsPlaying(!isPlaying);
          return;
        }
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: music.url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
      setCurrentMusic(music);
      setIsPlaying(true);
    } catch {
    }
  };

  const handlePlayPause = () => {
    if (!currentMusic) return;
    playMusicWithAbonnementCheck(currentMusic);
  };

  const handleNext = () => {
    if (!currentMusic || filteredMusics.length === 0) return;
    const currentIndex = filteredMusics.findIndex((m) => m.id === currentMusic.id);
    const nextIndex = (currentIndex + 1) % filteredMusics.length;
    playMusicWithAbonnementCheck(filteredMusics[nextIndex]);
  };

  const handlePrevious = () => {
    if (!currentMusic || filteredMusics.length === 0) return;
    const currentIndex = filteredMusics.findIndex((m) => m.id === currentMusic.id);
    const prevIndex = (currentIndex - 1 + filteredMusics.length) % filteredMusics.length;
    playMusicWithAbonnementCheck(filteredMusics[prevIndex]);
  };

  const getSliderPosition = () => {
    if (playbackStatus?.isLoaded && playbackStatus.durationMillis) {
      return playbackStatus.positionMillis / playbackStatus.durationMillis;
    }
    return 0;
  };

  const onSliderValueChange = async (value: number) => {
    if (soundRef.current && playbackStatus?.isLoaded && playbackStatus.durationMillis) {
      const newPosition = value * playbackStatus.durationMillis;
      await soundRef.current.setPositionAsync(newPosition);
    }
  };

  
    // 🔹 Fonction d’envoi de message WhatsApp
    const handleWhatsApp = (phone: string, message: string) => {
      if (!phone) return;
      const cleaned = phone.replace(/\s+/g, "");
      const formatted = cleaned.startsWith("0") ? `243${cleaned.slice(1)}` : cleaned;
  
      const encodedMessage = encodeURIComponent(message || "");
      const url = `https://wa.me/${formatted}?text=${encodedMessage}`;
      Linking.openURL(url).catch(() => Alert.alert("Cannot open WhatsApp"));
    };

    const facture = async (music:Song) => {
      try {
        
        const factureId = await FactureService.createFacture({
          uid: user?.uid,
          etat: "en attente",
          posteId: music.id?.toString() || "",
          scanned: false,
          items: [{ id: "1", nom: "payée pour la musique : "+music.titre, quantite: 1, prix: 0 }],
        });
        return factureId;
      } catch  {
        return null
      }
    }

    // call getFacturesByPostId
    const getFacturesByPostId = async (uid: string,songId: string) => {
      try {
        const res = await FactureService.getFacturesByPostId(uid,songId)
        if(res.length > 0) return res[0]
      } catch {
        return null
      }
    }

  // --- MISE À JOUR DE LA FONCTION handleDownload ---
  const handleDownload = async (music: Song) => {
    const songId = music.id?.toString();

    const getTel = await getFacturesByPostId(user?.uid,songId)

    
    if (!getTel) {
      const newFact = await facture(music)
      if (newFact) {
         const message = `🎵 Bonjour! je voudrais payée la facture N° ${newFact} pour la musique "${music.titre}" merci.`;
         handleWhatsApp(tel || "243000000000", message);
      }
      return;
    }

    
    if (getTel?.etat !== 'payée' ) {
      const message = `🎵 Bonjour! Ma facture N° ${getTel?.factureNumber} pour la musique "${music.titre}" est toujour en attente.`;
      handleWhatsApp(tel || "243000000000", message);
      return;
    }


    
    
    setDownloadStatuses(prev => new Map(prev).set(songId, { isDownloading: true, progress: 0, isDownloaded: false }));

    const onProgressUpdate = (progress: number) => {
      setDownloadStatuses(prev => {
        const current = prev.get(songId) || { isDownloading: true, progress: 0, isDownloaded: false };
        return new Map(prev).set(songId, { ...current, progress: progress });
      });
    };
    
    const fileName = `${music.titre.replace(/[^a-z0-9]/gi, '_')}.mp3`;

    try {
      // Assurez-vous que MusiqueService.downloadMusicLocally retourne le chemin du fichier (URI)
      const result = await MusiqueService.downloadMusicLocally(music.url, fileName, onProgressUpdate);
      
      setDownloadStatuses(prev => new Map(prev).set(songId, { 
        isDownloading: false, 
        progress: 1, 
        isDownloaded: true 
      }));

      if (!result.alreadyExists) {
        // Afficher la modale de succès
        
        setModalData({ title: music.titre, path: result.uri }); // Supposant que result.uri est le chemin
        setModalVisible(true);
      } else {
        console.log(result.uri)
         setModalData({ title: music.titre, path: result.uri }); // Supposant que result.uri est le chemin
          setModalVisible(true);
      }
      
    } catch {
      Alert.alert('Erreur de téléchargement', `Impossible de télécharger "${music.titre}".`);
      
      setDownloadStatuses(prev => new Map(prev).set(songId, { isDownloading: false, progress: 0, isDownloaded: false }));
    }
  };

  const deleteLocally = async (uri:any) => {
    await MusiqueService.deletLocally(uri)
  }


  // --- MISE À JOUR DE LA FONCTION renderSongItem ---
  const renderSongItem = ({ item, index }: ListRenderItemInfo<Song>) => {
    const status = downloadStatuses.get(item.id) || { isDownloading: false, progress: 0, isDownloaded: false };
    
    return (
      
        <View style={styles(colors).songItemContainer}>
          <Text style={styles(colors).songItemNumber}>{String(index + 1).padStart(2, '0')}</Text>
          <Image source={{ uri: item.albumArtUrl }} style={styles(colors).songItemArt} />
          <View style={styles(colors).songItemInfo}>
            <Text style={styles(colors).songItemTitle} numberOfLines={1}>{item.titre}</Text>
            <Text style={styles(colors).songItemArtist}>{item.artist}</Text>
          </View>

          {/* Download Button with Progress */}
          <View style={styles(colors).downloadButton}>
            {status.isDownloading ? (
              <View style={styles(colors).downloadProgressContainer}>
                <Progress.Circle 
                    progress={status.progress} 
                    size={30} 
                    thickness={3} 
                    color={colors.primary} 
                    unfilledColor="#ddd"
                    borderWidth={0}
                />
                <Text style={styles(colors).progressText}>{Math.round(status.progress * 100)}%</Text>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => handleDownload(item)}
                style={styles(colors).iconButton}
                
              >
                <Ionicons 
                  name={status.isDownloaded ? "checkmark-circle" : "cloud-download-outline"} 
                  size={24} 
                  color={status.isDownloaded ? "green" : colors.primary} 
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => playMusicWithAbonnementCheck(item)}>
            <Ionicons name="play-circle-outline" size={26} color={colors.primary} style={{marginLeft: 10}} />
          </TouchableOpacity>
{/* 
            <TouchableOpacity onPress={() => deleteLocally("file:///data/user/0/host.exp.exponent/files/musics/Michael_Jackson_.mp3")}>
              <Text>Delete</Text>
            </TouchableOpacity>
           */}

        </View>
      
    );
  };

  return (
    <LinearGradient colors={['#fff', '#fce8ed', '#fee2e9']} style={styles(colors).container}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header/>
        <View style={styles(colors).header}>
          
          <Text style={styles(colors).headerTextTitle}>🎶 Ma Playlist</Text>
          {hasActiveAbonnement ? (
            <TouchableOpacity onPress={handleRefresh}>
              <Ionicons name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={()=>checkAbonnementAndLoad()}>
              <Ionicons name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles(colors).searchContainer}>
          <Ionicons name="search" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles(colors).searchInput}
            placeholder="Rechercher une musique..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={handleSearch}
            editable={hasActiveAbonnement}
          />
        </View>

        {isLoading ? (
          <View style={styles(colors).loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles(colors).loadingText}>Chargement des musiques...</Text>
          </View>
        ) : hasActiveAbonnement ? (
          <>
            <View style={styles(colors).nowPlayingSection}>
              <Text style={styles(colors).songTitle} numberOfLines={1}>{currentMusic?.titre || 'Aucune musique sélectionnée'}</Text>
              <Text style={styles(colors).songArtist}>{currentMusic?.artist || ''}</Text>
              <Slider
                style={styles(colors).slider}
                minimumValue={0}
                maximumValue={1}
                value={getSliderPosition()}
                onSlidingComplete={onSliderValueChange}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="#ddd"
                thumbTintColor={colors.primary}
              />
              <View style={styles(colors).controls}>
                <TouchableOpacity onPress={handlePrevious}>
                  <Ionicons name="play-skip-back" size={30} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles(colors).playButton} onPress={handlePlayPause}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={35}
                    color="#fff"
                    style={{ marginLeft: isPlaying ? 0 : 4 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNext}>
                  <Ionicons name="play-skip-forward" size={30} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={filteredMusics}
              renderItem={renderSongItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            />
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontSize: 18, color: colors.text, textAlign: 'center' }}>
              ⚠️ Vous devez avoir un abonnement actif pour accéder à la musique.
            </Text>
          </View>
        )}
      </SafeAreaView>
      
      {/* MODALE DE TÉLÉCHARGEMENT */}
      <DownloadSuccessModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        musicTitle={modalData.title}
        filePath={modalData.path}
      />
    </LinearGradient>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 10, paddingVertical: 20 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    headerTextTitle: { color: colors.text, fontWeight: 'bold', fontSize: 20 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.9)',
      marginHorizontal: 20,
      marginTop: 10,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.text },
    nowPlayingSection: { paddingHorizontal: 30, paddingTop: 20, paddingBottom: 10 },
    songTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    songArtist: { fontSize: 15, color: 'gray', marginTop: 4, marginBottom: 20 },
    slider: { width: '100%', height: 40 },
    controls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    playButton: {
      width: 70,
      height: 70,
      backgroundColor: colors.primary,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    songItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    songItemNumber: { color: colors.primary, fontSize: 16, width: 30 },
    songItemArt: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
    songItemInfo: { flex: 1 },
    songItemTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    songItemArtist: { fontSize: 14, color: 'gray' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
    loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
    // STYLES MISE À JOUR pour le bouton de téléchargement avec progression
    downloadButton: {
      width: 45, // Augmenté pour accueillir le cercle de progression
      height: 45,
      justifyContent: 'center',
      alignItems: 'center',
    },
    downloadProgressContainer: {
        position: 'relative',
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        position: 'absolute',
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    }
  });


// --- STYLES SPÉCIFIQUES À LA MODALE ---
const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fond semi-transparent
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        color: '#333',
    },
    modalText: {
        marginBottom: 20,
        textAlign: "center",
        fontSize: 16,
        color: '#666',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        flex: 1,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 14,
    }
});


export default Play;