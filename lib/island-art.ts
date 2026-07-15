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

export interface IslandPresentation {
  desktopFocal: string;
  mobileFocal: string;
  contentSide: "left" | "right";
  scrimDirection: "left" | "right";
  contentWidth?: string;
}

export const ISLAND_PRESENTATION: Readonly<Record<string, IslandPresentation>> = {
  troy: { desktopFocal: "44% 52%", mobileFocal: "46% 48%", contentSide: "right", scrimDirection: "right", contentWidth: "610px" },
  cicones: { desktopFocal: "42% 52%", mobileFocal: "46% 48%", contentSide: "right", scrimDirection: "right", contentWidth: "600px" },
  lotus: { desktopFocal: "43% 50%", mobileFocal: "48% 45%", contentSide: "left", scrimDirection: "left", contentWidth: "590px" },
  cyclops: { desktopFocal: "52% 18%", mobileFocal: "56% 42%", contentSide: "left", scrimDirection: "left", contentWidth: "570px" },
  aeolia: { desktopFocal: "58% 50%", mobileFocal: "68% 44%", contentSide: "left", scrimDirection: "left", contentWidth: "570px" },
  laestrygonians: { desktopFocal: "39% 48%", mobileFocal: "46% 44%", contentSide: "right", scrimDirection: "right", contentWidth: "570px" },
  circe: { desktopFocal: "61% 50%", mobileFocal: "70% 44%", contentSide: "left", scrimDirection: "left", contentWidth: "580px" },
  underworld: { desktopFocal: "38% 50%", mobileFocal: "44% 46%", contentSide: "right", scrimDirection: "right", contentWidth: "580px" },
  sirens: { desktopFocal: "36% 50%", mobileFocal: "52% 45%", contentSide: "left", scrimDirection: "left", contentWidth: "520px" },
  scylla: { desktopFocal: "46% 50%", mobileFocal: "52% 47%", contentSide: "left", scrimDirection: "left", contentWidth: "500px" },
  thrinacia: { desktopFocal: "38% 50%", mobileFocal: "45% 45%", contentSide: "left", scrimDirection: "left", contentWidth: "560px" },
  calypso: { desktopFocal: "37% 50%", mobileFocal: "42% 45%", contentSide: "right", scrimDirection: "right", contentWidth: "570px" },
  phaeacia: { desktopFocal: "57% 50%", mobileFocal: "55% 45%", contentSide: "left", scrimDirection: "left", contentWidth: "560px" },
  ithaca: { desktopFocal: "34% 50%", mobileFocal: "38% 45%", contentSide: "right", scrimDirection: "right", contentWidth: "580px" },
};

export const ISLAND_FOCAL_POINTS: Readonly<Record<string, { desktop: string; mobile: string }>> = Object.fromEntries(
  Object.entries(ISLAND_PRESENTATION).map(([id, presentation]) => [id, { desktop: presentation.desktopFocal, mobile: presentation.mobileFocal }]),
);
