import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Los íconos ya vienen incluidos en Expo

export default function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#527DA3', // El color azul de tu app
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Oculta el encabezado superior por defecto
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'Descubrir',
          tabBarIcon: ({ color }) => <Ionicons name="flame" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}