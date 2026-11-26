# Leafhaus Maestro E2E tests

Maestro drives the app on an **iOS Simulator**. It cannot drive a physical
iPhone — Maestro's own docs list iOS support as simulators only — so the
Expo Go setup on the physical iPhone cannot be used for these tests.

## The working path: release build + regex text matching

The flows that pass are the **`-release` flows**, run against a **release
build** (`npx expo run:ios --configuration Release`). The bundle is
embedded in the app, so there is no Metro server, no dev launcher, and no
Expo developer-menu welcome modal to fight with. The release build
replaces the dev build on the simulator; restore the dev build later with
plain `npx expo run:ios`.

The older dev-build flows (`browse-flow.yaml`, `order-flow.yaml`) still
exist as a fallback — they load the bundle through the dev-client deep
link and handle the welcome modal — but they are not the working path.

### Two Maestro behaviours that decide how the flows are written

1. **Maestro matches an element's WHOLE text.** A drink card is one
   accessibility element whose text is the concatenation of everything on
   it, e.g. `"Jasmine Matcha Pure Tea, Jasmine Matcha Pure Tea, Jasmine
   green tea with matcha, RM 11.90"`. A plain drink name never matches
   that, so the flows use regex: `text: ".*Jasmine Matcha Pure Tea.*"`
   for asserts and taps, and the full concatenated string for the initial
   menu wait. The same applies to the Expo welcome modal paragraph.
2. **Photo testIDs are NOT exposed to iOS accessibility.** `drink-photo-N`
   and `cart-photo-N` do not appear in the screen hierarchy at all, so
   they cannot be tapped or asserted on. Button and input testIDs DO work
   (`header-back`, `voucher-input`, `order-details-toggle`).

The Welcome offer banner sits at the very bottom of the menu, below all
7 drinks, so it is off-screen on first load — the browse flow scrolls
down to it before asserting it.

### The Apply-button trap (fixed in the app, 25 Nov 2026)

`CartScreen`'s `ScrollView` had no `keyboardShouldPersistTaps`, so the
default `"never"` swallowed the first tap while the keyboard was up: it
only dismissed the keyboard and `applyVoucher` never ran. A real user
typing a voucher and tapping Apply once got nothing. Fixed with
`keyboardShouldPersistTaps="handled"` on the `ScrollView` in
`CartScreen` and on all three `ScrollView`s in `MenuScreen` (same trap
after typing in search). Any rebuild after a JS change needs a fresh
release build — see below.

### Bottom tabs and the White Peach tap (26 Nov 2026)

The app now has a bottom tab bar: Home (menu stack), the cup tab
(cart, `tab-order`), Orders (`tab-orders`) and Me (`tab-me`). The menu's
old top-bar Cart button is gone, so the browse flow opens the cart
through the cup tab's testID instead of tapping the text "Cart".

The browse flow also stopped tapping White Peach by its name regex: the
name exists twice in the hierarchy (the card text and the photo's
accessibility label), so the tap could land on the photo and open
nothing — the run failed on `.*Customise Drink.*` right after the
welcome-offer scroll. It now taps the card by its full concatenated
text (`"White Peach Oolong Tea, White Peach Oolong Tea, White peach,
roasted oolong, RM 12.90"`), which matches only the card itself.

## One-time setup (Mac mini)

```bash
# 1. Prerequisites — stop and install anything missing before going on.
java -version          # must be 17 or higher; install Temurin JDK if not
xcode-select -p        # must print a Developer path; if it errors, run:
xcode-select --install
pod --version          # CocoaPods, needed by the native build

# 2. Install the Maestro CLI (either way; both install the latest release).
curl -fsSL "https://get.maestro.mobile.dev" | bash
# or with Homebrew:
brew tap mobile-dev-inc/tap
brew install mobile-dev-inc/tap/maestro

maestro --version      # check the installed version (2.12.1 on 25 Nov 2026)
maestro --help

# 3. Build the release build for the simulator (first time, and after any
#    native change — and after any JS change too, because the bundle is
#    embedded in a release build).
cd ~/Documents/Projects/leafhaus-mobile
npx expo install expo-dev-client
npx expo run:ios --configuration Release
```

## Running the flows

```bash
# Boot a simulator if none is running, then run the flows.
maestro list-devices
maestro start-device --platform ios
xcrun simctl list devices booted

cd ~/Documents/Projects/leafhaus-mobile
maestro test --test-output-dir=./maestro-results .maestro/browse-flow-release.yaml
maestro test --test-output-dir=./maestro-results .maestro/order-flow-release.yaml
```

Screenshots land under `./maestro-results/<timestamp>/<flow-name>/takeScreenshot/`
(Maestro's default without the flag is `~/.maestro/tests`).

Maestro's live checklist output garbles/overlaps in the Antigravity
integrated terminal (ANSI in-place redraw + very long lines) — cosmetic
only, the run itself is unaffected. Widen the panel or use macOS Terminal
if it bothers you.

## WARNING: the order flow creates a real order

`order-flow-release.yaml` places a **real order** in the live Supabase
database (one row in `orders`, one in `order_items`). After the run,
delete it in the Supabase dashboard: Table Editor > `orders`, delete the
row with the pickup number shown on the confirmation screen, and its
matching row in `order_items`.

The pickup number is `T` + (201 + order count), so it is NOT always
T0201 — if older test orders are still in the table, the new one takes
the next number (e.g. T0204 when 3 older orders exist). Check whether
those older rows are test orders too before leaving them.

`browse-flow-release.yaml` places no order and is safe to run any number
of times.

## Files

- `browse-flow-release.yaml` — menu load, Welcome offer (scroll down
  first), White Peach details, back, empty cart. All green 25 Nov 2026.
  White Peach is tapped by its full card string since 26 Nov 2026 (the
  name regex could hit the photo label instead of the card); the
  empty-cart check goes through the cup tab (`tab-order`).
- `order-flow-release.yaml` — Jasmine Matcha Pure Tea, Large, No Ice, No
  Sugar, TEA20 (RM13.90 → RM11.12), order confirmation, details toggle.
  All green 25 Nov 2026; order verified in Supabase (T0204, RM11.12,
  TEA20, Touch 'n Go, 15 leaves, Horizon Mall). Since 26 Nov 2026 the
  flow hides the keyboard before tapping Place Order — the keyboard
  from the voucher input covers that bottom button, so the tap landed
  on the keyboard and the order was never placed.
- `browse-flow.yaml`, `order-flow.yaml` — dev-build variants (deep link +
  welcome-modal handling). Not the working path; kept as fallback.
- `probe-text-match.yaml`, `probe-visibility.yaml` — one-off probes from
  the diagnosis; keep for reference, not part of the suite.

## Diagnosis notes (25 Nov 2026)

Seven failed runs before the first green one. The chain: `clearState`
reinstalls the app on iOS and wipes the dev client's saved Metro URL
(dev launcher instead of the menu) → two Metro servers (8081 + 8082) →
Expo developer-menu welcome modal covering the menu on every fresh
install → Maestro cannot match the modal's text (in the hierarchy but
never "visible") → switched to a release build → menu assert still failed
on a clean rendered menu → the drink card is ONE accessibility element
with concatenated text → regex matching fixed it → Welcome offer is below
the fold → Apply tap swallowed by the keyboard (see above). Verify a
suspicion against the failure step's screen-hierarchy JSON in
`maestro-results/<timestamp>/` with
`grep -rni "<text>" <run-folder> | cut -c1-300` before changing a flow.
