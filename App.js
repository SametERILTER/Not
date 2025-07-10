import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import MainScreen from './assets/src/screens/MainScreen';
import AddNote from './assets/src/screens/AddNote';
import NoteDetails from './assets/src/screens/NoteDetails';
import AddReminder from './assets/src/screens/AddReminder';
import Settings from './assets/src/screens/Settings';

const Stack = createNativeStackNavigator();

export default function App() {
  // useFonts hook'u ile fontları yükle
  const [fontsLoaded] = useFonts({
    'InterNormal': require('./assets/src/fonts/Inter_24pt-Medium.ttf'),
    'InterBold': require('./assets/src/fonts/Inter_24pt-Bold.ttf'),
  });
  
  // TÜM useEffect hook'larını burada tanımlayın
  useEffect(() => {
    if (!fontsLoaded) return; // Fontlar yüklenmemişse useEffect içeriğini çalıştırma
    
    const setupChannels = async () => {
      if (Platform.OS === 'android') {
        try {
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            }),
          });
          await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Hatırlatıcı',
            vibrationPattern: [0, 250, 250, 250],
            sound: true,
          });
          console.log("Kanal oluşturuldu");
        } catch (error) {
          console.log('Kanal oluşturma hatası:', error);
        }
      }
    };
    setupChannels();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return; // Fontlar yüklenmemişse useEffect içeriğini çalıştırma
    
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };

    requestNotificationPermissions();

    const subscriptionListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Bildirim alındı:', notification);
    });

    const subscriptionResponse = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Bildirim yanıtı:', response);
    });

    return () => {
      subscriptionListener.remove();
      subscriptionResponse.remove();
    };
  }, [fontsLoaded]);

  // Yalnızca fontlar yüklendiğinde NavigationContainer'ı render yap
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="MainScreen" component={MainScreen} />
        <Stack.Screen name="AddNote" component={AddNote} />
        <Stack.Screen name="NoteDetails" component={NoteDetails} />
        <Stack.Screen name="AddReminder" component={AddReminder} />
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});