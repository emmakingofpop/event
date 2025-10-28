
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export const GreenLightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: '#A2492C',
    background: '#fff',        // soft green background
    card: 'rgba(247, 193, 153, 0.2)',  // glassy card
    text: 'black',
    border: '#F18537', // semi-transparent border
    notification: '#047857',
  },
};

export const GreenDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#A2492C',
    background: '#fff',        // soft green background
    card: 'rgba(247, 193, 153, 0.2)',  // glassy card
    text: 'black',
    border: '#F18537', // semi-transparent border
    notification: '#047857',
  },
};

export default function MainNavigator() {
  const colorScheme = useColorScheme();
  const { user,categorie } = useAuth();


  

  return (

    <ThemeProvider value={colorScheme === "light" ? GreenDarkTheme : GreenLightTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {user?.uid ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="LoginScreen" />
        )}
        <Stack.Screen name="SignUpScreen" />
        <Stack.Screen name="ProfileScreen" options={{ title: "" }} />
        <Stack.Screen name="ViewDetails" />
        <Stack.Screen name="ResetPasswordScreen" options={{ presentation: 'modal', title: 'ResetPasswordScreen' }} />
        <Stack.Screen name="TicketPayeeScreen" options={{ presentation: 'modal', title: 'TicketPayeeScreen' }} />
        <Stack.Screen name="ListePostulerScreen" options={{ presentation: 'modal', title: 'ListePostulerScreen' }} />
        <Stack.Screen name="GererLikeScreen" options={{ presentation: 'modal', title: 'GererLikeScreen' }} />
        <Stack.Screen name="GererAgentScanScreen" options={{ presentation: 'modal', title: 'GererAgentScanScreen' }} />
        <Stack.Screen name="GererAbonnement" options={{ presentation: 'modal', title: 'GererAbonnement' }} />
        <Stack.Screen name="gererFactureScreen" options={{ presentation: 'modal', title: 'gererFactureScreen' }} />
        <Stack.Screen name="AbonnementScreen" options={{ presentation: 'modal', title: 'AbonnementScreen' }} />
        <Stack.Screen name="ListeAbonnementScreen" options={{ presentation: 'modal', title: 'ListeAbonnementScreen' }} />
        <Stack.Screen name="FactureScreen" options={{ presentation: 'modal', title: 'FactureScreen' }} />
        <Stack.Screen name="Postuler" options={{ presentation: 'modal', title: 'Postuler' }} />
        <Stack.Screen name="AgentscanScreen" options={{ presentation: 'modal', title: 'AgentscanScreen' }} />
        <Stack.Screen name="QrCodeScanScreen" options={{ presentation: 'modal', title: 'QrCodeScanScreen' }} />
        <Stack.Screen name="MusiqueScreen" options={{ presentation: 'modal', title: 'MusiqueScreen' }} />
        <Stack.Screen name="VoteScreen" options={{ presentation: 'modal', title: 'VoteScreen' }} />
        <Stack.Screen name="ChatScreen" options={{ presentation: 'modal', title: 'Chat' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="ListePoste" options={{ presentation: 'modal',headerShown:true, title: categorie }} />
        <Stack.Screen name="UpdateArticle" options={{ presentation: 'modal', title: '' }}/>
        <Stack.Screen name="home" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>

  );
}
