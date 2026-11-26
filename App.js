// Leafhaus — Expo + React Native mobile app.
// Bottom tabs: Home (menu stack), Order (cart stack, the cup tab),
// Orders (history stack) and Me. Menu, customisation, cart/checkout,
// order tracking and order history, backed by Supabase (hosted
// PostgreSQL) with an AsyncStorage fallback.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/theme';
import { CartProvider } from './src/cart';
import { MarketProvider } from './src/market';
import MenuScreen from './src/screens/MenuScreen';
import CustomiseScreen from './src/screens/CustomiseScreen';
import CartScreen from './src/screens/CartScreen';
import OrderScreen from './src/screens/OrderScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import MeScreen from './src/screens/MeScreen';

const HomeStack = createNativeStackNavigator();
const OrderStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStackScreens() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Menu" component={MenuScreen} />
      <HomeStack.Screen name="Customise" component={CustomiseScreen} />
      <HomeStack.Screen name="Cart" component={CartScreen} />
      <HomeStack.Screen name="Order" component={OrderScreen} />
    </HomeStack.Navigator>
  );
}

function OrderStackScreens() {
  return (
    <OrderStack.Navigator screenOptions={{ headerShown: false }}>
      <OrderStack.Screen name="Cart" component={CartScreen} />
      <OrderStack.Screen name="Order" component={OrderScreen} />
    </OrderStack.Navigator>
  );
}

function OrdersStackScreens() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="Orders" component={OrdersScreen} />
      <OrdersStack.Screen name="Order" component={OrderScreen} />
    </OrdersStack.Navigator>
  );
}

// The middle tab is the cup: the order in progress. It sits in a raised
// deep-green circle, gold while it is the active tab.
function CupIcon({ focused }) {
  return (
    <View
      style={[styles.cupWrap, focused && styles.cupWrapFocused]}
      testID="cup-icon"
    >
      <Ionicons name="cafe" size={26} color="#fff" />
    </View>
  );
}

function TabIcon({ name, outlineName, focused }) {
  return (
    <Ionicons
      name={focused ? name : outlineName}
      size={24}
      color={focused ? COLORS.navy : COLORS.muted}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MarketProvider>
        <CartProvider>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.navy,
                tabBarInactiveTintColor: COLORS.muted,
                tabBarStyle: {
                  backgroundColor: COLORS.cream2,
                  borderTopColor: COLORS.line,
                },
              }}
            >
              <Tab.Screen
                name="Home"
                component={HomeStackScreens}
                options={{
                  tabBarTestID: 'tab-home',
                  tabBarIcon: ({ focused }) => (
                    <TabIcon name="home" outlineName="home-outline" focused={focused} />
                  ),
                }}
              />
              <Tab.Screen
                name="Order"
                component={OrderStackScreens}
                options={{
                  tabBarTestID: 'tab-order',
                  tabBarShowLabel: false,
                  tabBarIcon: ({ focused }) => <CupIcon focused={focused} />,
                }}
              />
              <Tab.Screen
                name="Orders"
                component={OrdersStackScreens}
                options={{
                  tabBarTestID: 'tab-orders',
                  tabBarIcon: ({ focused }) => (
                    <TabIcon
                      name="clipboard"
                      outlineName="clipboard-outline"
                      focused={focused}
                    />
                  ),
                }}
              />
              <Tab.Screen
                name="Me"
                component={MeScreen}
                options={{
                  tabBarTestID: 'tab-me',
                  tabBarIcon: ({ focused }) => (
                    <TabIcon name="person" outlineName="person-outline" focused={focused} />
                  ),
                }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </CartProvider>
      </MarketProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cupWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  cupWrapFocused: { backgroundColor: COLORS.gold },
});
