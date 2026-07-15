export const ISLAND_ART: Readonly<Record<string, string>> = {
  troy: "/islands/troy.webp",
  cicones: "/islands/cicones.webp",
  lotus: "/islands/lotus-eaters.webp",
  cyclops: "/islands/cyclops.webp",
  aeolia: "/islands/aeolus.webp",
  laestrygonians: "/islands/laestrygonians.webp",
  circe: "/islands/circe.webp",
  underworld: "/islands/underworld.webp",
  sirens: "/islands/sirens.webp",
  scylla: "/islands/scylla-charybdis.webp",
  thrinacia: "/islands/helios-cattle.webp",
  calypso: "/islands/calypso.webp",
  phaeacia: "/islands/phaeacia.webp",
  ithaca: "/islands/ithaca.webp",
};

export interface IslandFocalPoint {
  desktop: string;
  mobile: string;
}

export const ISLAND_FOCAL_POINTS: Readonly<Record<string, IslandFocalPoint>> = {
  troy: { desktop: "44% 52%", mobile: "46% 48%" },
  cicones: { desktop: "42% 52%", mobile: "46% 48%" },
  lotus: { desktop: "43% 50%", mobile: "48% 45%" },
  cyclops: { desktop: "42% 50%", mobile: "48% 44%" },
  aeolia: { desktop: "58% 50%", mobile: "58% 46%" },
  laestrygonians: { desktop: "39% 50%", mobile: "46% 46%" },
  circe: { desktop: "61% 50%", mobile: "58% 44%" },
  underworld: { desktop: "38% 50%", mobile: "44% 46%" },
  sirens: { desktop: "36% 50%", mobile: "44% 46%" },
  scylla: { desktop: "42% 50%", mobile: "48% 47%" },
  thrinacia: { desktop: "38% 50%", mobile: "45% 45%" },
  calypso: { desktop: "37% 50%", mobile: "46% 45%" },
  phaeacia: { desktop: "57% 50%", mobile: "55% 45%" },
  ithaca: { desktop: "34% 50%", mobile: "43% 45%" },
};
