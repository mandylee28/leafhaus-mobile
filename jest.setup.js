// Jest setup — runs once before every test file.
//
// The app stores offline orders in AsyncStorage, which is a native
// (phone-only) module: in Jest there is no phone, so importing it throws
// "NativeModule: AsyncStorage is null". The fix is the one the
// AsyncStorage docs recommend: replace it with the in-memory mock the
// package itself ships. No real storage is touched by the tests.
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
