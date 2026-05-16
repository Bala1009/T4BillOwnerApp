// =============================================================================
// Src/hooks/useNotifications.js
// =============================================================================
// RESPONSIBILITY:
//   A reusable custom hook that gives any component convenient access to
//   notification capabilities.  It combines:
//     - Context values from NotificationContext  (token, last notification, etc.)
//     - Action functions from notificationService (schedule, cancel, badge, etc.)
//
//   This hook is the ONLY import a component needs to work with notifications.
//
// USAGE:
//   import { useNotifications } from '../hooks/useNotifications';
//
//   function MyScreen() {
//     const {
//       expoPushToken,
//       notification,
//       isRegistered,
//       scheduleLocal,
//       cancelAll,
//     } = useNotifications();
//
//     return <Text>{expoPushToken}</Text>;
//   }
//
// WHY A SEPARATE HOOK?
//   - Keeps components clean — one import instead of two
//   - Easy to extend with derived/computed values
//   - Centralised place to add notification-related helpers
//   - Testable in isolation
// =============================================================================

import { useCallback } from 'react';
import { useNotificationContext } from '../context/NotificationContext';
import {
  scheduleLocalNotification,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  getBadgeCount,
  setBadgeCount,
  registerForPushNotificationsAsync,
} from '../services/notificationService';

/**
 * Custom hook that provides everything a component needs for notifications.
 *
 * @returns {Object} Notification state and actions
 *
 * STATE:
 * @returns {string|null}  expoPushToken          - Device push token
 * @returns {Object|null}  notification           - Last foreground notification
 * @returns {Object|null}  notificationResponse   - Last notification tap response
 * @returns {boolean}      isRegistered           - Whether registration succeeded
 *
 * COMPUTED:
 * @returns {string|null}  lastNotificationTitle  - Title of last notification
 * @returns {string|null}  lastNotificationBody   - Body of last notification
 * @returns {Object|null}  lastNotificationData   - Custom data payload
 *
 * ACTIONS:
 * @returns {Function}     scheduleLocal          - Schedule a local notification
 * @returns {Function}     cancelOne              - Cancel a single notification
 * @returns {Function}     cancelAll              - Cancel all notifications
 * @returns {Function}     getBadge               - Get current badge count
 * @returns {Function}     setBadge               - Set badge count
 * @returns {Function}     reRegister             - Re-trigger push registration
 */
export function useNotifications() {
  // -------------------------------------------------------------------
  // 1. GRAB CONTEXT VALUES
  // -------------------------------------------------------------------
  const {
    expoPushToken,
    notification,
    notificationResponse,
    isRegistered,
  } = useNotificationContext();

  // -------------------------------------------------------------------
  // 2. COMPUTED / DERIVED VALUES
  // -------------------------------------------------------------------
  // These are convenience getters so components don't need to drill
  // into the raw notification object.

  /** Title of the most recently received foreground notification */
  const lastNotificationTitle =
    notification?.request?.content?.title ?? null;

  /** Body text of the most recently received foreground notification */
  const lastNotificationBody =
    notification?.request?.content?.body ?? null;

  /** Custom data payload of the most recently received notification */
  const lastNotificationData =
    notification?.request?.content?.data ?? null;

  // -------------------------------------------------------------------
  // 3. WRAPPED ACTION FUNCTIONS
  // -------------------------------------------------------------------
  // We wrap service functions in useCallback so they are stable across
  // re-renders and safe to pass as props.

  /**
   * Schedule a local notification.
   *
   * @param {Object}  opts
   * @param {string}  opts.title   - Notification title
   * @param {string}  opts.body    - Notification body
   * @param {Object}  opts.data    - Custom payload
   * @param {number}  opts.seconds - Delay in seconds (default: 1)
   * @returns {Promise<string>} Notification identifier
   */
  const scheduleLocal = useCallback(
    ({ title, body, data, seconds } = {}) =>
      scheduleLocalNotification({ title, body, data, seconds }),
    []
  );

  /**
   * Cancel a specific scheduled notification.
   *
   * @param {string} id - Notification identifier
   */
  const cancelOne = useCallback(
    (id) => cancelScheduledNotification(id),
    []
  );

  /**
   * Cancel all scheduled notifications.
   */
  const cancelAll = useCallback(
    () => cancelAllScheduledNotifications(),
    []
  );

  /**
   * Get the current badge count.
   *
   * @returns {Promise<number>}
   */
  const getBadge = useCallback(() => getBadgeCount(), []);

  /**
   * Set the badge count.
   *
   * @param {number} count
   */
  const setBadge = useCallback((count) => setBadgeCount(count), []);

  /**
   * Re-trigger push notification registration.
   * Useful after a user logs in or switches accounts.
   *
   * @returns {Promise<string|null>} New push token or null
   */
  const reRegister = useCallback(
    () => registerForPushNotificationsAsync(),
    []
  );

  // -------------------------------------------------------------------
  // 4. RETURN EVERYTHING
  // -------------------------------------------------------------------
  return {
    // State from context
    expoPushToken,
    notification,
    notificationResponse,
    isRegistered,

    // Computed values
    lastNotificationTitle,
    lastNotificationBody,
    lastNotificationData,

    // Actions
    scheduleLocal,
    cancelOne,
    cancelAll,
    getBadge,
    setBadge,
    reRegister,
  };
}
