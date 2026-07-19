import type { Metadata } from "next";
import "./globals.css";
import { SoundscapeControl } from "./soundscape-control";

export const metadata: Metadata = {
  title: "Odyssey · 返鄉之旅",
  description: "An AI-native mythic journey across fourteen shores.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}<SoundscapeControl/></body></html>;
}
