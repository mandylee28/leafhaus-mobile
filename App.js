// Leafhaus — Expo + React Native mobile app.
// Menu, customisation, cart/checkout, order tracking and order history,
// backed by Supabase (hosted PostgreSQL) with an AsyncStorage fallback.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from './src/cart';
import MenuScreen from './src/screens/MenuScreen';
import CustomiseScreen from './src/screens/CustomiseScreen';
import CartScreen from './src/screens/CartScreen';
import OrderScreen from './src/screens/OrderScreen';
import OrdersScreen from './src/screens/OrdersScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Menu" component={MenuScreen} options={{ title: 'Leafhaus', headerShown: false }} />
          <Stack.Screen
            name="Customise"
            component={CustomiseScreen}
            options={{ title: 'Customise Drink' }}
          />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Cart' }} />
          <Stack.Screen name="Order" component={OrderScreen} options={{ title: 'Order Details' }} />
          <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
        </Stack.Navigator>
      </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
}
