import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '@react-navigation/native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MusiqueService from '../../services/MusiqueService';

interface Song {
  id: string | number;
  titre: string;
  url: string;
  description?: string;
  artist: string;
  albumArtUrl: string;
}

const Play = () => {
  const { colors } = useTheme();
  const [musics, setMusics] = useState<Song[]>([]);
  const [filteredMusics, setFilteredMusics] = useState<Song[]>([]);
  const [currentMusic, setCurrentMusic] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus | null>(null);

  useEffect(() => {
    loadMusics();
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

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
      const data = await MusiqueService.getMusics();
      const formattedData: Song[] = data.map((song: any) => ({
        ...song,
        artist: song.description || 'Artiste inconnu',
        albumArtUrl: `https://picsum.photos/seed/${song.id}/200`,
      }));
      setMusics(formattedData);
      setFilteredMusics(formattedData);
      if (formattedData.length > 0 && !currentMusic) setCurrentMusic(formattedData[0]);
    } catch (error) {
      console.error('Erreur lors du chargement des musiques:', error);
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
    } catch (error) {
      console.error('Erreur de lecture:', error);
    }
  };

  const handlePlayPause = () => {
    if (!currentMusic) return;
    playMusic(currentMusic);
  };

  const handleNext = () => {
    if (!currentMusic || filteredMusics.length === 0) return;
    const currentIndex = filteredMusics.findIndex((m) => m.id === currentMusic.id);
    const nextIndex = (currentIndex + 1) % filteredMusics.length;
    playMusic(filteredMusics[nextIndex]);
  };

  const handlePrevious = () => {
    if (!currentMusic || filteredMusics.length === 0) return;
    const currentIndex = filteredMusics.findIndex((m) => m.id === currentMusic.id);
    const prevIndex = (currentIndex - 1 + filteredMusics.length) % filteredMusics.length;
    playMusic(filteredMusics[prevIndex]);
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

  const renderSongItem = ({ item, index }: ListRenderItemInfo<Song>) => (
    <TouchableOpacity onPress={() => playMusic(item)}>
      <View style={styles(colors).songItemContainer}>
        <Text style={styles(colors).songItemNumber}>{String(index + 1).padStart(2, '0')}</Text>
        <Image source={{ uri: item.albumArtUrl }} style={styles(colors).songItemArt} />
        <View style={styles(colors).songItemInfo}>
          <Text style={styles(colors).songItemTitle} numberOfLines={1}>{item.titre}</Text>
          <Text style={styles(colors).songItemArtist}>{item.artist}</Text>
        </View>
        <Ionicons name="musical-notes" size={22} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#fff', '#fce8ed', '#fee2e9']} style={styles(colors).container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header + Refresh + Search */}
        <View style={styles(colors).header}>
          <Text style={styles(colors).headerTextTitle}>🎶 Ma Playlist</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <View style={styles(colors).searchContainer}>
          <Ionicons name="search" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles(colors).searchInput}
            placeholder="Rechercher une musique..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Section en cours de lecture */}
        <View style={styles(colors).nowPlayingSection}>
          <Text style={styles(colors).songTitle}>{currentMusic?.titre || 'Aucune musique sélectionnée'}</Text>
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

        {/* Liste des musiques */}
        <FlatList
          data={filteredMusics}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      </SafeAreaView>
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
  });

export default Play;
