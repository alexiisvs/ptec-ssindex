export type CatImage = {
  src: string;
  alt: string;
};

export const CAT_IMAGES: readonly CatImage[] = [
  {
    src: "/cat-discover.jpg",
    alt: "Gato naranja mirando hacia arriba",
  },
  { src: "/cat-02.jpg", alt: "Gato atigrado mirando a la camara" },
  { src: "/cat-03.jpg", alt: "Gato atigrado sobre un fondo blanco" },
  { src: "/cat-04.jpg", alt: "Retrato de un gato bajo luz natural" },
  { src: "/cat-05.jpg", alt: "Gatito sobre un fondo oscuro" },
  { src: "/cat-06.jpg", alt: "Gato gris de ojos verdes" },
  { src: "/cat-07.jpg", alt: "Primer plano de un gato atigrado" },
  { src: "/cat-08.jpg", alt: "Gato descansando y mirando de frente" },
  { src: "/cat-09.jpg", alt: "Retrato cercano de un gato marron" },
  { src: "/cat-10.jpg", alt: "Gato junto a una cortina iluminada" },
];

export function pickNextCatImageIndex(
  previousIndex: number | null,
  random: () => number = Math.random,
): number {
  if (previousIndex === null) {
    return Math.floor(random() * CAT_IMAGES.length);
  }

  const candidate = Math.floor(random() * (CAT_IMAGES.length - 1));
  return candidate >= previousIndex ? candidate + 1 : candidate;
}
