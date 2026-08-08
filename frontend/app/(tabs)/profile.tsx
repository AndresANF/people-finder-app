import { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, 
  TextInput, Image, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../../constants/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
        handleLogout();
        return;
      }

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setUserData(data);
        setEditName(data.name || '');
        setEditBio(data.bio || '');
      } else {
        Alert.alert('Error', 'No se pudo cargar la información del perfil');
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http') || imagePath.startsWith('file://')) return imagePath;

    let cleanPath = imagePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.replace('uploads/', '');
    if (cleanPath.startsWith('/uploads/')) cleanPath = cleanPath.replace('/uploads/', '');
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

    const baseUrl = API_URL.replace('/api', ''); 
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setEditImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!editName.trim() || editName.trim().length < 3) {
      Alert.alert('Error', 'El nombre debe tener al menos 3 caracteres.');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('bio', editBio.trim());

      if (editImage && !editImage.startsWith('http')) {
        const filename = editImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append('profileImage', {
          uri: editImage,
          name: filename,
          type
        } as any);
      }

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUserData(data);
        setIsEditing(false);
        Alert.alert('Éxito', 'Perfil actualizado correctamente.');
      } else {
        Alert.alert('Error', data.error || 'No se pudo actualizar el perfil.');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'Problema de conexión al guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      '¿Borrar cuenta?',
      'Esta acción es irreversible. Perderás todos tus matches, mensajes y datos. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, borrar mi cuenta', style: 'destructive', onPress: handleDelete }
      ]
    );
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        Alert.alert('Cuenta borrada', 'Tu cuenta ha sido eliminada con éxito.');
        handleLogout();
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'No se pudo borrar la cuenta.');
      }
    } catch (error) {
      Alert.alert('Error', 'Problema de conexión al intentar borrar la cuenta.');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      router.replace('/' as any);
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al cerrar sesión.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#527DA3" />
      </View>
    );
  }

  const currentImage = editImage || getImageUrl(userData?.profileImage);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        
        {/* Encabezado */}
        <View style={styles.header}>
          {isEditing ? (
            <TouchableOpacity onPress={pickImage} style={styles.imageEditWrapper}>
              <View style={styles.avatarPlaceholder}>
                {currentImage ? (
                  <Image source={{ uri: currentImage }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="camera" size={40} color="#888" />
                )}
              </View>
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.imageEditWrapper}>
              <View style={styles.avatarPlaceholder}>
                {currentImage ? (
                  <Image source={{ uri: currentImage }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={60} color="#ccc" />
                )}
              </View>
            </View>
          )}

          {isEditing ? (
            <TextInput
              style={styles.inputName}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tu nombre"
              maxLength={30}
            />
          ) : (
            <Text style={styles.name}>{userData?.name || 'Usuario'}</Text>
          )}
          <Text style={styles.email}>{userData?.email || 'correo@ejemplo.com'}</Text>
        </View>

        {/* Sección de Biografía */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Biografía</Text>
          {isEditing ? (
            <TextInput
              style={styles.inputBio}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Cuéntales sobre ti..."
              multiline
              maxLength={150}
            />
          ) : (
            <Text style={styles.bio}>{userData?.bio || 'Aún no has escrito una biografía.'}</Text>
          )}
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionsContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={() => {
                  setIsEditing(false);
                  setEditName(userData?.name || '');
                  setEditBio(userData?.bio || '');
                  setEditImage(null);
                }}
              >
                <Ionicons name="close-circle-outline" size={24} color="#666" />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.editModeButton]} 
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil-outline" size={24} color="#527DA3" />
              <Text style={styles.editModeText}>Editar Perfil</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botones de Cierre y Borrado */}
        {!isEditing && (
          <View style={styles.dangerZone}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FF4B4B" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={24} color="#fff" />
              <Text style={styles.deleteText}>Borrar mi cuenta</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  imageEditWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#527DA3', overflow: 'hidden'
  },
  avatarImage: { width: '100%', height: '100%' },
  editBadge: {
    position: 'absolute', bottom: 5, right: 5,
    backgroundColor: '#527DA3', width: 32, height: 32,
    borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff'
  },
  name: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 16, color: '#888', marginTop: 5 },
  inputName: {
    fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center',
    borderBottomWidth: 1, borderBottomColor: '#527DA3', paddingBottom: 5, minWidth: '60%',
    marginTop: 5, marginBottom: 5
  },
  infoSection: {
    backgroundColor: '#fff', padding: 20, marginTop: 20,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#527DA3', marginBottom: 10 },
  bio: { fontSize: 16, color: '#555', lineHeight: 24 },
  inputBio: {
    fontSize: 16, color: '#555', lineHeight: 24,
    backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10,
    minHeight: 100, textAlignVertical: 'top'
  },
  actionsContainer: { padding: 20 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 10, marginBottom: 15
  },
  editModeButton: { backgroundColor: '#e6f0fa', borderWidth: 1, borderColor: '#527DA3' },
  editModeText: { fontSize: 16, fontWeight: 'bold', color: '#527DA3', marginLeft: 10 },
  saveButton: { backgroundColor: '#527DA3' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  cancelButton: { backgroundColor: '#e0e0e0' },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: '#666', marginLeft: 10 },
  dangerZone: { marginTop: 10 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee'
  },
  logoutText: { fontSize: 18, fontWeight: 'bold', color: '#FF4B4B', marginLeft: 10 },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF4B4B', paddingVertical: 15, marginTop: 20,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FF4B4B'
  },
  deleteText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 10 }
});