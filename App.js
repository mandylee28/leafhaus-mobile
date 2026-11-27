// Leafhaus — Expo + React Native mobile app.
// Bottom tabs: Home (menu stack), Order (cart stack, the cup tab),
// Orders (history stack) and Me. Menu, customisation, cart/checkout,
// order tracking and order history, backed by Supabase (hosted
// PostgreSQL) with an AsyncStorage fallback.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/theme';
import { CartProvider, useCart } from './src/cart';
import { MarketProvider } from './src/market';
import MenuScreen from './src/screens/MenuScreen';
import CustomiseScreen from './src/screens/CustomiseScreen';
import CartScreen from './src/screens/CartScreen';
import OrderScreen from './src/screens/OrderScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import MeScreen from './src/screens/MeScreen';
import FloatingGift from './src/components/FloatingGift';

// Lets the floating gift button (rendered outside the navigator)
// jump to the Me tab.
const navigationRef = createNavigationContainerRef();

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
// deep-green circle, gold while it is the active tab, and it has no label
// under it. The label is hidden with tabBarLabel: () => null, NOT with
// tabBarShowLabel: false — in @react-navigation/bottom-tabs v6 the
// showLabel flag is read from the FOCUSED tab's options and applied to
// every tab, so tabBarShowLabel: false on the cup hid Home, Orders and
// Me as well whenever the cup was focused (seen on a real phone 26 Nov
// 2026). tabBarLabel: () => null hides only the cup's own label.
//
// The cup also rocks gently every few seconds, and when the cart has
// items a count bubble sits on its top-right corner — Leafhaus's
// version of the reference app's rocking cup with its pop-up bubble.
// That app's bubble says "Menu" because its cup tab IS the menu;
// Leafhaus's cup tab is the cart, so the bubble shows the cart count
// instead, and only appears when there is something in the cart.
// Note: bottom-tabs renders each tab icon twice (active + inactive,
// cross-faded), so this component — and the bubble — mount twice;
// on a real phone the two copies sit exactly on top of each other.
function CupIcon({ focused }) {
  const { cart } = useCart();
  const count = cart.reduce((n, item) => n + item.qty, 0);
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const wobbling = Animated.loop(
      Animated.sequence([
        Animated.delay(2400),
        Animated.timing(wiggle, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: -1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ])
    );
    wobbling.start();
    return () => wobbling.stop();
  }, [wiggle]);

  const rotate = wiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <View
        style={[styles.cupWrap, focused && styles.cupWrapFocused]}
        testID="cup-icon"
      >
        <Ionicons name="cafe" size={26} color="#fff" />
      </View>
      {count > 0 && (
        <View style={styles.cupBubble} testID="cup-bubble">
          <Text style={styles.cupBubbleText}>{count}</Text>
        </View>
      )}
    </Animated.View>
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
          <View style={styles.appRoot}>
            <NavigationContainer ref={navigationRef}>
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
                  tabBarLabel: () => null,
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
            <FloatingGift onPress={() => navigationRef.navigate('Me')} />
          </View>
        </CartProvider>
      </MarketProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1 },
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
  cupBubble: {
    position: 'absolute',
    top: -8,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupBubbleText: {
    color: COLORS.cream2,
    fontSize: 12,
    fontWeight: '700',
  },
});
