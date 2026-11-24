// Tests for src/supabase.js: whether the app counts itself as
// "configured" from the EXPO_PUBLIC_SUPABASE_URL / ANON_KEY environment
// variables, and whether it creates a client. Run them with: npm test
//
// supabase.js reads the environment once, when the module loads, so each
// test sets the variables first and then loads a fresh copy of the module
// (jest.resetModules + require). The real @supabase/supabase-js package
// is ESM-only and Jest cannot load it, so it is replaced with a fake
// createClient that records its arguments and returns a marker object.
// The other test files replace '../supabase' itself instead; this file
// is the one place that checks the real module.

// The package mock is registered here (hoisted) and used by every
// fresh require('../supabase') below. Do not import createClient at the
// top level: jest.resetModules() replaces the mock fn, so only the
// instance returned by loadSupabaseModule() is the live one.
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ __fakeClient: true })),
}));

const REAL_URL = 'https://abcdefghijklmnopqrst.supabase.co';
const REAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakekey';

const ORIGINAL_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function loadSupabaseModule() {
  jest.resetModules();
  // The fresh require re-runs the mock factory, so it hands back a new
  // createClient fn — the tests must assert on this one, not on a
  // top-level import, which still points at the pre-reset instance.
  const supabaseModule = require('../supabase');
  const { createClient } = require('@supabase/supabase-js');
  return { ...supabaseModule, createClient };
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
});

afterAll(() => {
  if (ORIGINAL_URL === undefined) {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  } else {
    process.env.EXPO_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  }
  if (ORIGINAL_KEY === undefined) {
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_KEY;
  }
});

describe('isSupabaseConfigured', () => {
  test('false with no environment variables, and no client is made', () => {
    const { isSupabaseConfigured, supabase, createClient } = loadSupabaseModule();
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  test('true with a real-looking URL and key, and a client is made', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = REAL_URL;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = REAL_KEY;
    const { isSupabaseConfigured, supabase, createClient } = loadSupabaseModule();
    expect(isSupabaseConfigured).toBe(true);
    expect(supabase).toEqual({ __fakeClient: true });
    expect(createClient).toHaveBeenCalledWith(REAL_URL, REAL_KEY);
  });

  // The placeholder URL from config.example.js is not a real project.
  test('false when the URL is still the placeholder', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL =
      'https://YOUR-PROJECT.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = REAL_KEY;
    const { isSupabaseConfigured, supabase, createClient } = loadSupabaseModule();
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  // The placeholder key from config.example.js is not a real key.
  test('false when the key is still the placeholder', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = REAL_URL;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
    const { isSupabaseConfigured, supabase, createClient } = loadSupabaseModule();
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
  });

  test('false when only the URL is set', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = REAL_URL;
    const { isSupabaseConfigured, supabase, createClient } = loadSupabaseModule();
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
  });

  test('false when only the key is set', () => {
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = REAL_KEY;
    const { isSupabaseConfigured, supabase, createClient } = loadSupabaseModule();
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
  });
});
