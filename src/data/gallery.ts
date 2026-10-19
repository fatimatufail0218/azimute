import type { JourneySlide } from "@/components/PhotoJourney";
import { interiors, outdoors } from "./journeys";

export type Category = "interiors" | "outdoors" | "living" | "plans";
export type GalleryItem = JourneySlide & { category: Category };

const living: JourneySlide[] = [
  { src: "/living1.webp", title: "Sabores e encontros", alt: "Espaço gourmet externo com bancada de pedra, churrasqueira e forno.", pos: "50% 58%" },
  { src: "/living2.webp", title: "Entre jardins e conversas", alt: "Pátio com mesas, parede verde e acesso ao jardim para pets.", pos: "50% 55%" },
  { src: "/living3.webp", title: "Lugar de encontro", alt: "Mesas sob ombrelones em um pátio com jardim vertical.", pos: "50% 57%" },
  { src: "/living4.webp", title: "Companhia em todos os momentos", alt: "Área ajardinada com circuito de obstáculos para pets.", pos: "50% 56%" },
];

const plans: JourneySlide[] = [
  { src: "/plan1.webp", title: "Vista superior dos ambientes", alt: "Estudo de distribuição com dormitórios, estar integrado e terraço. Metragem não identificada.", pos: "50% 50%" },
  { src: "/plan2.webp", title: "Vista superior do terraço", alt: "Estudo de distribuição com terraço, piscina e ambientes internos. Metragem não identificada.", pos: "50% 50%" },
];

const tag = (list: JourneySlide[], category: Category): GalleryItem[] =>
  list.map((slide) => ({ ...slide, category }));

/* Gallery order: interiors, outdoors, living, plans */
export const gallery: GalleryItem[] = [
  ...tag(interiors, "interiors"),
  ...tag(outdoors, "outdoors"),
  ...tag(living, "living"),
  ...tag(plans, "plans"),
];