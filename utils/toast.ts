/**
 * Toast utility for showing success and error messages
 * All messages appear at the top-right of the screen
 */

import Toast from "react-native-toast-message";

/**
 * Show a success toast message (green)
 */
export const showSuccessToast = (message: string, duration = 3000): void => {
  Toast.show({
    type: "success",
    text1: message,
    position: "top",
    topOffset: 60,
    visibilityTime: duration,
  });
};

/**
 * Show an error toast message (red)
 */
export const showErrorToast = (message: string, duration = 4000): void => {
  Toast.show({
    type: "error",
    text1: message,
    position: "top",
    topOffset: 60,
    visibilityTime: duration,
  });
};

/**
 * Show an info toast message (blue)
 */
export const showInfoToast = (message: string, duration = 3000): void => {
  Toast.show({
    type: "info",
    text1: message,
    position: "top",
    topOffset: 60,
    visibilityTime: duration,
  });
};
