import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { colors } = useTheme();
  const { user } = useAuth();
  let unreadCount = 0;

 if (!user) {
    // User is not logged in → go to login
    return <Redirect href="/LoginScreen" />;
  }
  
  

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute', // makes it float
          marginHorizontal: 5,  // horizontal margin
          marginBottom: 5,      // bottom margin
          borderRadius: 20,      // rounded corners
          height: 70,            // adjust height if needed
          shadowColor: '#000',   // optional shadow
          backgroundColor: colors.primary,
          bottom: 40,
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 5 },
          shadowRadius: 10,
          elevation: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="poste"
        options={{
          title: 'Poste',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="liste"
        options={{
          title: 'Liste',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={28} color={color} />,
        }}
      />
            
      <Tabs.Screen
        name="play"
        options={{
          title: "Musique",
          tabBarIcon: ({ color }) => (
            <Ionicons name="musical-notes" size={28} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined, // only show if > 0
          tabBarBadgeStyle: { backgroundColor: "red", color: "white" },
        }}
      />

      
      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle" size={28} color={color} />
          ),
        }}
      />


    </Tabs>
  );
}
