import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/api';

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect ejecuta la función cada vez que entras a esta pestaña
  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [])
  );

  const fetchMatches = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Llamamos a la ruta de matches mutuos
      const response = await fetch(`${API_URL}/matches`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMatches(data);
      }
    } catch (error) {
      console.error('Error cargando matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return 'https://via.placeholder.com/150';
    if (imagePath.startsWith('http') || imagePath.startsWith('file://')) return imagePath;

    let cleanPath = imagePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.replace('uploads/', '');
    if (cleanPath.startsWith('/uploads/')) cleanPath = cleanPath.replace('/uploads/', '');
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

    const baseUrl = API_URL.replace('/api', ''); 
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#527DA3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tus Matches</Text>
      
      {matches.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aún no tienes matches. ¡Sigue deslizando para conocer gente!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.matchCard}
              onPress={() => router.push(`/chat/${item.matchId}?userName=${item.name}` as any)}
            >
              <Image source={{ uri: getImageUrl(item.profileImage) }} style={styles.avatar} />
              <View style={styles.matchInfo}>
                <Text style={styles.matchName}>{item.name}</Text>
                <Text style={styles.matchSubtitle}>Toca para chatear</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#527DA3', marginBottom: 20, marginTop: 30 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15, backgroundColor: '#eee' },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  matchSubtitle: { fontSize: 14, color: '#888', marginTop: 4 }
});