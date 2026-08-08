import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/api';

const { height, width } = Dimensions.get('window');

export default function SwipeScreen() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCards(data);
      } else {
        Alert.alert('Error', data.error || 'No se pudieron cargar los usuarios');
      }
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      Alert.alert('Error de red', 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (cardIndex: number, action: 'LIKE' | 'NOPE') => {
    const swipedUser = cards[cardIndex];
    if (!swipedUser) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_URL}/swipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          swipedId: swipedUser.id,
          isLike: action === 'LIKE' 
        })
      });

      const result = await response.json();
      console.log(`Respuesta del servidor al dar ${action}:`, result);

    } catch (error) {
      console.error(`Error de red al registrar el swipe (${action}):`, error);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return 'https://via.placeholder.com/400x600?text=Sin+Foto';
    if (imagePath.startsWith('http')) return imagePath;

    let cleanPath = imagePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.replace('uploads/', '');
    if (cleanPath.startsWith('/uploads/')) cleanPath = cleanPath.replace('/uploads/', '');
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

    const baseUrl = API_URL.replace('/api', ''); 
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerElements]}>
        <ActivityIndicator size="large" color="#527DA3" />
        <Text style={styles.loadingText}>Buscando personas cerca...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cards.length > 0 ? (
        <Swiper
          cards={cards}
          renderCard={(card) => {
            if (!card) return <View style={styles.card} />;
            
            const imageUrl = getImageUrl(card.profileImage || card.image);
            console.log('Intentando cargar imagen:', imageUrl);

            return (
              <View style={styles.card}>
                <Image 
                  source={{ uri: imageUrl }} 
                  style={styles.image} 
                />
                
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.gradient}
                />
                
                <View style={styles.textContainer}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{card.name}</Text>
                    {card.age && <Text style={styles.age}>{card.age}</Text>}
                  </View>
                  <Text style={styles.bio}>{card.bio || 'Sin biografía'}</Text>
                </View>
              </View>
            );
          }}
          onSwipedLeft={(cardIndex) => handleSwipe(cardIndex, 'NOPE')}
          onSwipedRight={(cardIndex) => handleSwipe(cardIndex, 'LIKE')}
          onSwipedAll={() => console.log('No hay más personas en tu área')}
          cardIndex={0}
          backgroundColor={'#f0f2f5'}
          stackSize={3}
          animateCardOpacity
          verticalSwipe={false}
          cardVerticalMargin={50}
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: { backgroundColor: 'transparent', borderColor: '#FF4B4B', color: '#FF4B4B', borderWidth: 5, fontSize: 34, fontWeight: '900', borderRadius: 10, padding: 10 },
                wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 40, marginLeft: -40 }
              }
            },
            right: {
              title: 'LIKE',
              style: {
                label: { backgroundColor: 'transparent', borderColor: '#4CCC93', color: '#4CCC93', borderWidth: 5, fontSize: 34, fontWeight: '900', borderRadius: 10, padding: 10 },
                wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 40, marginLeft: 40 }
              }
            }
          }}
        />
      ) : (
        <View style={styles.centerElements}>
          <Text style={styles.emptyText}>No hay más personas en tu área.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centerElements: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  card: {
    flex: 0.85,
    borderRadius: 20,
    justifyContent: 'flex-end',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  textContainer: {
    padding: 20,
    paddingBottom: 30,
    zIndex: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  age: {
    fontSize: 24,
    color: 'white',
    marginLeft: 10,
    fontWeight: '400',
  },
  bio: {
    fontSize: 16,
    color: 'white',
    lineHeight: 22,
    opacity: 0.9,
  },
});