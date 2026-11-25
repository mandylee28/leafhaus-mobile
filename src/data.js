// Leafhaus — built-in menu data.
// Used as the fallback when Supabase is not configured, and while the
// database lists are loading. Matches the seed data in supabase-schema.sql.

export const STORES = [
  'Leafhaus MY Horizon Mall',
  'Leafhaus MY Eco Botanic',
  'Leafhaus MY Aeon Bukit Indah',
];

export const CATEGORIES = ['All', 'Milk Tea', 'Pure Tea', 'Fruit Tea', 'Matcha'];

export const VOUCHERS = {
  WELCOME50: 0.5,
  TEA20: 0.2,
  LEAF10: 0.1,
};

export const DRINKS = [
  { id: 1, name: 'Jasmine Matcha Pure Tea', price: 11.9, category: 'Matcha',
    desc: 'Jasmine green tea with matcha', color: '#7a9b57', bg: '#f3ecdc',
    image: require('../assets/drinks/drink-1-jasmine-matcha.png') },
  { id: 2, name: 'Jasmine Green Milk Tea', price: 12.9, category: 'Milk Tea',
    desc: 'Jasmine green tea, fresh milk', color: '#b9c98a', bg: '#f3ecdc',
    image: require('../assets/drinks/drink-2-jasmine-milk-tea.png') },
  { id: 3, name: 'Brown Sugar Pearl Milk Tea', price: 13.9, category: 'Milk Tea',
    desc: 'Brown sugar pearls, milk tea', color: '#8a5a33', bg: '#f3ecdc',
    image: require('../assets/drinks/drink-3-brown-sugar-pearl.png') },
  { id: 4, name: 'White Peach Oolong Tea', price: 12.9, category: 'Fruit Tea',
    desc: 'White peach, roasted oolong', color: '#e8a0a8', bg: '#f3ecdc',
    image: require('../assets/drinks/drink-4-white-peach-oolong.png') },
  { id: 5, name: 'Mango Green Tea', price: 11.9, category: 'Fruit Tea',
    desc: 'Fresh mango, jasmine green tea', color: '#f0a832', bg: '#f3ecdc',
    image: require('../assets/drinks/drink-5-mango-green-tea.png') },
  { id: 6, name: 'Roasted Oolong Milk Tea', price: 12.9, category: 'Milk Tea',
    desc: 'Roasted oolong, fresh milk', color: '#a97c2f', bg: '#f3ecdc',
    image: require('../assets/drinks/drink-6-roasted-oolong.png') },
  { id: 7, name: 'Lemon Honey Black Tea', price: 10.9, category: 'Pure Tea',
    desc: 'Lemon, honey, black tea', color: '#d9b23a', bg: '#f3ecdc',
    image: require('../assets/drinks/drink-7-lemon-honey.png') },
];

export const STATUS_STEPS = ['Ordered', 'Preparing', 'Collection', 'Completed'];
export const LEAVES_PER_ORDER = 15;
export const STORAGE_KEY = 'leafhaus_orders_v1';

export function money(n) {
  return 'RM ' + Number(n).toFixed(2);
}

export function formatTime(value) {
  const d = new Date(value);
  const pad = (x) => String(x).padStart(2, '0');
  return (
    pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  );
}
