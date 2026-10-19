import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, Marcellus } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Azimute — Seu próximo horizonte | ASL",
  description:
    "Conheça o Residencial Azimute, da ASL, na Vila Vitória, em Mauá.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${instrumentSerif.variable} ${marcellus.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}