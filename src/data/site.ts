export const STUDIO = {
  name: "Flexarion",
  legalName: "Flexarion Studio",
  tagline: "Studio de jeux vidéo indépendant · Science-fiction Solarpunk · Aix-en-Provence",
  city: "Aix-en-Provence",
  region: "Provence-Alpes-Côte d'Azur",
  country: "FR",
  foundedYear: "2026",
  instagramMain: "https://instagram.com/flexarion",
  instagramHandle: "@flexarion",
  instagramBackupHandle: "@flexarion_official",
  githubRepo: "https://github.com/Androtim/Flexarion",
  flagshipGame: {
    title: "VERIDIA 2140",
    genre: "Stratégie & City-Builder Solarpunk",
    businessModel: "Modèle pensé : Jeu indé payant (sans microtransactions)",
    platform: "PC (Concept en pré-production)",
    status: "Concept de jeu vidéo réalisé en cadre universitaire (IUT d'Aix-Marseille)",
  },
};

export const NAV_ITEMS = [
  { label: "Accueil", href: "/" },
  { label: "Le Studio", href: "/studio/" },
  { label: "Veridia 2140", href: "/jeux/veridia-2140/" },
  { label: "Devlogs", href: "/devlogs/" },
  { label: "Contact & Presse", href: "/contact/", isCta: true },
];

export function buildOrganizationSchema(siteOrigin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: STUDIO.legalName,
    alternateName: STUDIO.name,
    url: siteOrigin,
    logo: `${siteOrigin}/images/flexarion-logo.svg`,
    description:
      "Flexarion est un studio de développement de jeux vidéo indépendant basé à Aix-en-Provence, spécialisé dans la science-fiction Solarpunk et les jeux de stratégie systémiques comme Veridia 2140.",
    address: {
      "@type": "PostalAddress",
      addressLocality: STUDIO.city,
      addressRegion: STUDIO.region,
      addressCountry: STUDIO.country,
    },
    sameAs: [STUDIO.instagramMain, STUDIO.githubRepo],
  };
}
