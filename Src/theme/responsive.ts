import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base dimensions (iPhone 14 — 390 × 844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * Scale a value horizontally based on screen width.
 * Use for horizontal paddings, margins, widths, font sizes, icon sizes.
 */
export function wp(size: number): number {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Scale a value vertically based on screen height.
 * Use for vertical paddings, margins, heights.
 */
export function hp(size: number): number {
    const scale = SCREEN_HEIGHT / BASE_HEIGHT;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Moderate scale — less aggressive scaling for fonts/icons.
 * factor: 0.5 = halfway between no scaling and full scaling.
 */
export function ms(size: number, factor: number = 0.5): number {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size + (scale - 1) * size * factor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export { SCREEN_HEIGHT, SCREEN_WIDTH };

