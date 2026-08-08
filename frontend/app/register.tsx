import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../constants/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const validateInputs = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedBio = bio.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || trimmedName.length < 2) {
      Alert.alert('Error', 'El nombre es obligatorio y debe tener al menos 2 caracteres reales.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      Alert.alert('Error', 'Por favor, ingresa un correo electrónico válido.');
      return false;
    }

    if (!trimmedPassword || trimmedPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres reales.');
      return false;
    }

    if (!trimmedBio) {
      Alert.alert('Error', 'La biografía es obligatoria.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;

    try {
      const formData = new FormData();
      formData.append('email', email.trim());
      formData.append('password', password);
      formData.append('name', name.trim());
      formData.append('bio', bio.trim());

      if (image) {
        let filename = image.split('/').pop();
        let match = /\.(\w+)$/.exec(filename || '');
        let type = match ? `image/${match[1]}` : `image`;
        formData.append('profileImage', { uri: image, name: filename, type } as any);
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Cuenta creada. Ahora inicia sesión.');
        router.back();
      } else {
        Alert.alert('Error', data.error || 'Hubo un problema al crear la cuenta.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor. Revisa tu conexión.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardView} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Crear Cuenta</Text>

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : (
            <Text style={styles.imagePickerText}>Toca para subir foto</Text>
          )}
        </TouchableOpacity>

        <TextInput 
          style={styles.input} 
          placeholder="Nombre" 
          value={name} 
          onChangeText={setName}
          maxLength={50}
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Correo electrónico" 
          value={email} 
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          maxLength={100}
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Contraseña" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          maxLength={50}
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Biografía" 
          value={bio} 
          onChangeText={setBio}
          maxLength={255}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#527DA3', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#527DA3', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  imagePicker: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  imagePickerText: { color: '#888', textAlign: 'center' }
});