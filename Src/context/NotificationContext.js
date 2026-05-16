// =============================================================================
// Src/context/NotificationContext.js
// =============================================================================
// RESPONSIBILITY:
//   This Context Provider is the glue between the notification service and
//   your React component tree.  It:
//     1. Initialises push notifications on mount (token + channel + handlers)
//     2. Sets up event listeners for received & tapped notifications
//     3. Stores the push token + last notification in React state
//     4. Handles navigation when the user taps a notification
//     5. Cleans up listeners on unmount
//
// WHAT LIVES HERE:
//   ✅ React state for notification data
//   ✅ useEffect lifecycle for listeners
//   ✅ Navigation on notification tap
//   ✅ Context Provider + consumer hook
//
// WHAT DOES NOT LIVE HERE:
//   ❌ Raw expo-notifications calls  → use notificationService.js
//   ❌ Business logic (API calls)    → use dedicated service files
// =============================================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

import {
  configureForegroundNotifications,
  registerForPushNotificationsAsync,
} from '../services/notificationService';

// ---------------------------------------------------------------------------
// 1. CREATE THE CONTEXT
// ---------------------------------------------------------------------------

const NotificationContext = createContext(undefined);

// ---------------------------------------------------------------------------
// 2. NOTIFICATION PROVIDER
// ---------------------------------------------------------------------------

/**
 * Wrap your app with <NotificationProvider> to enable push notifications.
 *
 * Provides:
 *   - expoPushToken   : The device's Expo push token (string | null)
 *   - notification    : The last received notification object
 *   - notificationResponse : The last notification tap response
 *   - isRegistered    : Whether push registration succeeded
 *
 * @example
 *   // In app/index.js (or _layout.js)
 *   <NotificationProvider>
 *     <App />
 *   </NotificationProvider>
 */
export function NotificationProvider({ children }) {
  // ── State ────────────────────────────────────────────────────────────
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [notificationResponse, setNotificationResponse] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // ── Refs for listeners (so we can remove them on unmount) ────────────
  const notificationReceivedListener = useRef(null);
  const notificationResponseListener = useRef(null);

  // ── Navigation ref ───────────────────────────────────────────────────
  // We use try/catch because the navigation might not be ready yet on
  // first render.
  let navigation = null;
  try {
    navigation = useNavigation();
  } catch {
    // Navigation container not yet mounted — that's fine.
    // Notification taps that arrive before nav is ready will be queued
    // in `notificationResponse` state for manual handling.
  }

  // -------------------------------------------------------------------
  // 3. HANDLE NOTIFICATION TAP (navigation)
  // -------------------------------------------------------------------
  // This callback fires when the user taps a notification.
  // Inspect the `data` payload to decide where to navigate.
  //
  // CUSTOMISATION POINT — add your own routing logic here.
  // -------------------------------------------------------------------
  const handleNotificationTap = useCallback(
    (response) => {
      console.log(
        '[NotificationContext] Notification tapped:',
        JSON.stringify(response.notification.request.content.data, null, 2)
      );

      // Store the response so components can react to it
      setNotificationResponse(response);

      // Extract the custom data payload sent from your server
      const data = response.notification.request.content.data;

      if (!navigation) {
        console.warn(
          '[NotificationContext] Navigation not ready — tap stored in state'
        );
        return;
      }

      // ── Route based on data.screen ──────────────────────────────────
      // Your server should send a payload like:
      //   { "screen": "Notifications", "params": { ... } }
      //
      // Add more cases as your app grows.
      // ────────────────────────────────────────────────────────────────
      try {
        switch (data?.screen) {
          case 'Notifications':
            navigation.navigate('Notifications');
            break;

          case 'ProductDetail':
            navigation.navigate('ProductDetail', data?.params || {});
            break;

          // Add more screens here as needed
          // case 'Orders':
          //   navigation.navigate('Main', { screen: 'Orders' });
          //   break;

          default:
            // Fallback: go to Notifications screen
            navigation.navigate('Notifications');
            break;
        }
      } catch (navError) {
        console.error(
          '[NotificationContext] Navigation failed:',
          navError.message
        );
      }
    },
    [navigation]
  );

  // -------------------------------------------------------------------
  // 4. INITIALISATION EFFECT
  // -------------------------------------------------------------------
  useEffect(() => {
    // ── 4a. Configure foreground behaviour ─────────────────────────────
    // Must run before any notification arrives.
    configureForegroundNotifications();

    // ── 4b. Register for push + get token ─────────────────────────────
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          setExpoPushToken(token);
          setIsRegistered(true);
          console.log('[NotificationContext] Token stored in context');

          // ============================================================
          // TODO — SEND TOKEN TO YOUR BACKEND
          // ============================================================
          // Call your API here to save the token against the logged-in
          // user so your server can target this device later.
          //
          // Example:
          //   api.post('/devices/register', { pushToken: token });
          // ============================================================
        }
      })
      .catch((err) =>
        console.error('[NotificationContext] Registration error:', err)
      );

    // ── 4c. Listener: notification RECEIVED (foreground) ──────────────
    // Fires when a notification arrives while the app is open.
    notificationReceivedListener.current =
      Notifications.addNotificationReceivedListener((notif) => {
        console.log(
          '[NotificationContext] Notification received in foreground:',
          notif.request.content.title
        );
        setNotification(notif);
      });

    // ── 4d. Listener: notification TAPPED ──────────────────────────────
    // Fires when the user taps a notification (from any state).
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationTap
      );

    // ── 4e. Check if the app was opened via a notification tap ────────
    // If the app was killed and the user tapped a notification to open
    // it, the response listener above won't catch it.  We need to check
    // the "last notification response" manually.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log(
          '[NotificationContext] App opened from notification tap (cold start)'
        );
        handleNotificationTap(response);
      }
    });

    // ── 4f. Cleanup on unmount ─────────────────────────────────────────
    return () => {
      if (notificationReceivedListener.current) {
        Notifications.removeNotificationSubscription(
          notificationReceivedListener.current
        );
      }
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(
          notificationResponseListener.current
        );
      }
      console.log('[NotificationContext] Listeners cleaned up');
    };
  }, [handleNotificationTap]);

  // -------------------------------------------------------------------
  // 5. CONTEXT VALUE
  // -------------------------------------------------------------------
  const contextValue = {
    /** The device's Expo push token (string | null) */
    expoPushToken,

    /** The last notification received while app was in foreground */
    notification,

    /** The last notification response (tap) */
    notificationResponse,

    /** Whether push registration completed successfully */
    isRegistered,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// 6. CONSUMER HOOK
// ---------------------------------------------------------------------------

/**
 * Hook to access notification context values.
 * Must be used inside <NotificationProvider>.
 *
 * @returns {{ expoPushToken, notification, notificationResponse, isRegistered }}
 */
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotificationContext must be used within a <NotificationProvider>'
    );
  }
  return context;
}
