import {
  Syncopate,
  Unbounded,
  Permanent_Marker,
  Anton,
  Major_Mono_Display,
  Rubik_Mono_One,
  Fraunces,
  Instrument_Serif,
  Michroma,
} from "next/font/google";

export const fontSyncopate = Syncopate({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-syncopate",
});

export const fontUnbounded = Unbounded({
  weight: ["900"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-unbounded",
});

export const fontPermanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-permanent-marker",
});

export const fontAnton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-anton",
});

export const fontMajorMonoDisplay = Major_Mono_Display({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-major-mono-display",
});

export const fontRubikMonoOne = Rubik_Mono_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-rubik-mono-one",
});

export const fontFraunces = Fraunces({
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-fraunces",
});

export const fontInstrumentSerif = Instrument_Serif({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-instrument-serif",
});

export const fontMichroma = Michroma({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-michroma",
});

/**
 * Loads a specified font with a 1.5s timeout safeguard.
 * Returns true if font loaded successfully, false if timed out or failed.
 */
export async function waitForFont(
  fontFamily: string,
  weight: string | number = "400",
  style: "normal" | "italic" = "normal",
  timeoutMs = 1500
): Promise<boolean> {
  if (typeof document === "undefined" || !document.fonts || !document.fonts.load) {
    return true;
  }
  try {
    const spec = `${style === "italic" ? "italic " : ""}${weight} 100px "${fontFamily}"`;
    const loadPromise = document.fonts.load(spec);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Font load timeout")), timeoutMs)
    );
    await Promise.race([loadPromise, timeoutPromise]);
    return true;
  } catch {
    return false;
  }
}
