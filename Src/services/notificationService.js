// =============================================================================
// Src/services/notificationService.js
// =============================================================================
// RESPONSIBILITY:
//   This file is the single source of truth for all notification logic.
//   It contains pure utility functions — no React, no hooks, no state.
//   Any component or hook that needs notification capabilities calls these
//   functions instead of importing expo-notifications directly.
//
// WHAT LIVES HERE:
//   ✅ Android notification channel setup
//   ✅ Permission request
//   ✅ Expo push token generation
//   ✅ Foreground notification behaviour configuration
//   ✅ Local notification scheduling helpers
//
// WHAT DOES NOT LIVE HERE:
//   ❌ React state / hooks / context
//   ❌ Listeners (those live in NotificationContext)
//   ❌ Navigation logic
// =============================================================================

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// 1. FOREGROUND NOTIFICATION BEHAVIOUR
// ---------------------------------------------------------------------------
// This tells the OS what to do when a notification arrives while the app is
// in the foreground.  Without this, foreground notifications are silently
// swallowed on Android.
//
// IMPORTANT — Call this at the TOP-LEVEL of your app (outside any component)
// so it registers before any notification arrives.  We export a function so
// the consumer can call it once from NotificationContext or _layout.
// ---------------------------------------------------------------------------

/**
 * Configures how notifications behave when the app is in the foreground.
 * Must be called once, as early as possible (e.g. in NotificationProvider).
 *
 * @param {Object} options - Optional overrides for the default behaviour.
 * @param {boolean} options.shouldShowAlert  - Show an in-app banner (default: true)
 * @param {boolean} options.shouldPlaySound  - Play the notification sound  (default: true)
 * @param {boolean} options.shouldSetBadge   - Update the app badge count   (default: false)
 */
export function configureForegroundNotifications(options = {}) {
  const {
    shouldShowAlert = true,
    shouldPlaySound = true,
    shouldSetBadge = false,
  } = options;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert,
      shouldPlaySound,
      shouldSetBadge,
    }),
  });

  console.log('[NotificationService] Foreground handler configured');
}

// ---------------------------------------------------------------------------
// 2. ANDROID NOTIFICATION CHANNEL
// ---------------------------------------------------------------------------
// Android 8+ (API 26) REQUIRES a notification channel.  Without one the user
// will never see notifications — they are silently dropped.
//
// Call this once at app startup.  If the channel already exists the OS simply
// ignores the duplicate call, so it is safe to call every launch.
// ---------------------------------------------------------------------------

/**
 * Creates the default notification channel for Android.
 * No-op on iOS.
 *
 * @param {Object} channelConfig - Optional overrides.
 * @param {string} channelConfig.id          - Channel ID    (default: 'default')
 * @param {string} channelConfig.name        - Channel name  (default: 'Default')
 * @param {number} channelConfig.importance  - Importance    (default: MAX)
 * @param {string} channelConfig.description - Description shown in system settings
 * @param {boolean} channelConfig.sound      - Play sound    (default: true)
 * @param {boolean} channelConfig.vibrate    - Vibrate       (default: true)
 */
export async function setupNotificationChannel(channelConfig = {}) {
  if (Platform.OS !== 'android') return;

  const {
    id = 'default',
    name = 'Default',
    importance = Notifications.AndroidImportance.MAX,
    description = 'Default notification channel for T4Bill Owner App',
    sound = true,
    vibrate = true,
  } = channelConfig;

  await Notifications.setNotificationChannelAsync(id, {
    name,
    importance,
    description,
    sound,
    vibrationPattern: vibrate ? [0, 250, 250, 250] : null,
    lightColor: '#7C84F8', // Matches your app accent colour
  });

  console.log(`[NotificationService] Android channel "${id}" ready`);
}

// ---------------------------------------------------------------------------
// 3. PERMISSION REQUEST
// ---------------------------------------------------------------------------
// Expo wraps the platform-specific permission APIs.  We first check the
// current status, and only prompt if we have not been granted yet.
//
// Returns { granted: boolean, status: string }
// ---------------------------------------------------------------------------

/**
 * Requests notification permission from the user.
 *
 * @returns {Promise<{ granted: boolean, status: string }>}
 */
export async function requestNotificationPermission() {
  // 1️⃣  Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 2️⃣  If not determined / denied, ask the user
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  const granted = finalStatus === 'granted';

  if (!granted) {
    console.warn(
      '[NotificationService] Permission NOT granted. Status:',
      finalStatus
    );
  } else {
    console.log('[NotificationService] Permission granted ✅');
  }

  return { granted, status: finalStatus };
}

// ---------------------------------------------------------------------------
// 4. EXPO PUSH TOKEN GENERATION
// ---------------------------------------------------------------------------
// The Expo push token is the unique address for this device.  You send this
// token to your backend so it can target notifications to this device.
//
// REQUIREMENTS:
//   - Must be a PHYSICAL device (emulators cannot receive push notifications)
//   - Notification permission must be granted first
//   - projectId must match the one in app.json → extra.eas.projectId
// ---------------------------------------------------------------------------

/**
 * Registers the device for push notifications and returns the Expo push token.
 *
 * @returns {Promise<string|null>} The Expo push token string, or null on failure.
 */
export async function registerForPushNotificationsAsync() {
  try {
    // ── Step 1: Physical device check ──────────────────────────────────
    if (!Device.isDevice) {
      console.warn(
        '[NotificationService] Push notifications require a physical device.'
      );
      return null;
    }

    // ── Step 2: Set up the Android channel ─────────────────────────────
    await setupNotificationChannel();

    // ── Step 3: Request permission ─────────────────────────────────────
    const { granted } = await requestNotificationPermission();
    if (!granted) return null;

    // ── Step 4: Get the Expo push token ────────────────────────────────
    // The projectId links this token to your EAS project so Expo's push
    // service knows which app to route the notification to.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.error(
        '[NotificationService] Missing projectId in app.json → extra.eas.projectId'
      );
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    console.log('[NotificationService] Expo Push Token:', token);

    return token;
  } catch (error) {
    console.error('[NotificationService] Registration failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. LOCAL NOTIFICATION HELPERS
// ---------------------------------------------------------------------------
// Use these to schedule notifications directly from the device (no server
// needed).  Handy for reminders, in-app alerts, and testing.
// ---------------------------------------------------------------------------

/**
 * Schedule a local notification to fire after `seconds` seconds.
 *
 * @param {Object} options
 * @param {string} options.title   - Notification title
 * @param {string} options.body    - Notification body text
 * @param {Object} options.data    - Custom data payload (accessible in listeners)
 * @param {number} options.seconds - Delay in seconds (default: 1)
 * @returns {Promise<string>} The scheduled notification identifier
 */
export async function scheduleLocalNotification({
  title = 'T4Bill',
  body = '',
  data = {},
  seconds = 1,
} = {}) {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      type: 'timeInterval',
      seconds,
      repeats: false,
    },
  });

  console.log(`[NotificationService] Scheduled notification (id: ${id})`);
  return id;
}

/**
 * Cancel a single scheduled notification by its identifier.
 *
 * @param {string} notificationId
 */
export async function cancelScheduledNotification(notificationId) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  console.log(`[NotificationService] Cancelled notification: ${notificationId}`);
}

/**
 * Cancel ALL scheduled notifications.
 */
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[NotificationService] All scheduled notifications cancelled');
}

/**
 * Get the current badge count.
 *
 * @returns {Promise<number>}
 */
export async function getBadgeCount() {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set the app badge count.
 *
 * @param {number} count
 */
export async function setBadgeCount(count = 0) {
  await Notifications.setBadgeCountAsync(count);
}