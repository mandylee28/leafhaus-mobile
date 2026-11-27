// The floating gift button — Leafhaus's own take on the floating
// promo gift in the reference app's Me screen: a gold circle with a
// gift icon, bobbing gently above the tab bar, with a confetti burst
// every few seconds. Tapping it opens the Me tab (vouchers live
// under My Benefits there).
//
// The gift is Leafhaus's own (Ionicons, gold on the theme) — no brand
// imagery from the reference app is used anywhere here. Motion uses
// React Native's built-in Animated API; no new package.

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

// Seven confetti dots around the gift. Each has its own colour and
// burst direction (angle); the burst value (0..1) is shared, and each
// dot interpolates it into its own outward flight and fade.
const CONFETTI_COLORS = [
  '#9c7c2e',
  '#1e3a2f',
  '#c96f4a',
  '#e8b4b8',
  '#7fb069',
  '#f4d35e',
  '#ee964b',
];
const CONFETTI = CONFETTI_COLORS.map((color, i) => {
  const angle = (i / CONFETTI_COLORS.length) * Math.PI * 2;
  return { color, dx: Math.cos(angle) * 36, dy: Math.sin(angle) * 36 };
});

export default function FloatingGift({ onPress }) {
  const bob = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  // Gentle up-down bob, forever.
  useEffect(() => {
    const bobbing = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -8,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    bobbing.start();
    return () => bobbing.stop();
  }, [bob]);

  // Confetti burst every few seconds: dots fly out and fade, then reset.
  useEffect(() => {
    const bursting = Animated.loop(
      Animated.sequence([
        Animated.delay(2400),
        Animated.timing(burst, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(burst, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    bursting.start();
    return () => bursting.stop();
  }, [burst]);

  return (
    <Animated.View style={[styles.float, { transform: [{ translateY: bob }] }]}>
      {CONFETTI.map((dot, i) => (
        <Animated.View
          key={i}
          testID="gift-confetti"
          style={[
            styles.confetti,
            { backgroundColor: dot.color },
            {
              opacity: burst.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateX: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, dot.dx],
                  }),
                },
                {
                  translateY: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, dot.dy],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        testID="floating-gift"
        accessibilityRole="button"
        accessibilityLabel="Gift"
      >
        <Ionicons name="gift" size={26} color={COLORS.navy} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  float: {
    position: 'absolute',
    right: 16,
    bottom: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confetti: {
    position: 'absolute',
    left: 25,
    top: 25,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
