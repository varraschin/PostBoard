import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator  from './src/navigation/AppNavigator';
import BannerOffline from './src/components/BannerOffline';
 
export default function App() {
  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        {/* Banner aparece no topo de qualquer tela quando offline */}
        <BannerOffline />
        <AppNavigator />
      </View>
    </NavigationContainer>
  );
}
