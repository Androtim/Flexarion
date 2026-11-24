export const STUDIO = {
  name: "Flexarion",
  legalName: "Flexarion Studio",
  tagline: "Studio de jeux vidéo indépendant · Science-fiction Solarpunk · Aix-en-Provence",
  city: "Aix-en-Provence",
  region: "Provence-Alpes-Côte d'Azur",
  country: "FR",
  foundedYear: "2026",
  instagramMain: "https://www.instagram.com/flexarion/",
  youtube: "https://www.youtube.com/channel/UCBPnOAYTH0rcCcjEtnBVk-Q",
  x: "https://x.com/FlexarionStudio",
  itch: "https://flexarion-studio.itch.io/",
  gamejolt: "https://gamejolt.com/games/veridia/1120816",
  tiktok: "https://www.tiktok.com/@flexarion_studio",
  xHandle: "@FlexarionStudio",
  instagramHandle: "@flexarion",
  instagramBackupHandle: "@flexarion.official",
  githubRepo: "https://github.com/Androtim/Flexarion",
  flagshipGame: {
    title: "VERIDIA 2140",
    genre: "Puzzle & stratégie en temps réel",
    businessModel: "Gratuit, sans publicité",
    platform: "Navigateur web (ordinateur et téléphone), itch.io, Game Jolt",
    status: "Jeu réalisé en cadre universitaire (IUT d'Aix-Marseille)",
  },
};

export const NAV_ITEMS = [
  { label: "Accueil", href: "/" },
  { label: "Le Studio", href: "/studio/" },
  { label: "Veridia 2140", href: "/jeux/veridia-2140/" },
  { label: "REWIRE", href: "/jeux/rewire/" },
  { label: "Univers", href: "/jeux/veridia-2140/univers/" },
  { label: "Jouer", href: "/jouer/" },
  { label: "Devlogs", href: "/devlogs/" },
  { label: "Contact & Presse", href: "/contact/", isCta: true },
];

export function buildOrganizationSchema(siteOrigin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteOrigin}/#organization`,
    name: STUDIO.name,
    legalName: STUDIO.legalName,
    alternateName: ["Flexarion Studio", "Studio Flexarion"],
    url: `${siteOrigin}/`,
    logo: {
      "@type": "ImageObject",
      url: `${siteOrigin}/images/flexarion-logo.png`,
      width: 1280,
      height: 272,
    },
    image: `${siteOrigin}/images/veridia-hero.jpg`,
    description:
      "Flexarion est un studio de développement de jeux vidéo indépendant basé à Aix-en-Provence, spécialisé dans la science-fiction Solarpunk et les jeux de stratégie systémiques comme Veridia 2140.",
    foundingDate: STUDIO.foundedYear,
    foundingLocation: {
      "@type": "Place",
      name: `${STUDIO.city}, France`,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: STUDIO.city,
      addressRegion: STUDIO.region,
      addressCountry: STUDIO.country,
    },
    areaServed: "FR",
    knowsAbout: [
      "Développement de jeux vidéo",
      "Science-fiction",
      "Solarpunk",
      "City-builder",
      "Simulation systémique",
    ],
    sameAs: [STUDIO.instagramMain, STUDIO.youtube, STUDIO.x, STUDIO.tiktok, STUDIO.itch, STUDIO.gamejolt, STUDIO.githubRepo],
  };
}

export function buildWebSiteSchema(siteOrigin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteOrigin}/#website`,
    name: STUDIO.name,
    alternateName: ["Flexarion Studio", "Studio Flexarion"],
    url: `${siteOrigin}/`,
    inLanguage: "fr-FR",
    publisher: { "@id": `${siteOrigin}/#organization` },
  };
}
