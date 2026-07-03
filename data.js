export const categories = [
  { id: "ledenadministratie", icon: "♙", nl: { title: "Ledenadministratie", description: "Inschrijven, uitschrijven en wijzigingen van leden." }, en: { title: "Membership", description: "Registrations, cancellations and member changes." } },
  { id: "it-support", icon: "◇", nl: { title: "IT Support", description: "Gebruikers, toegang en ondersteuning van clubsystemen." }, en: { title: "IT Support", description: "Users, access and support for club systems." } }
];

export const flowCatalog = [
  {
    id: "nieuwe-inschrijving",
    file: "flows/nieuwe-inschrijving.json",
    category: "ledenadministratie",
    status: "draft",
    nl: {
      title: "Nieuwe inschrijving",
      description: "Verwerk een nieuwe inschrijving en informeer de juiste betrokkenen.",
      keywords: ["inschrijven", "nieuw lid", "aanmelden", "vrijwilliger", "wachtlijst", "g-hockey", "trimmer"]
    },
    en: {
      title: "New registration",
      description: "Process a new registration and inform the correct people.",
      keywords: ["registration", "new member", "volunteer", "waiting list", "g-hockey", "trim hockey"]
    }
  },
  {
    id: "uitschrijving",
    file: "flows/uitschrijving.json",
    category: "ledenadministratie",
    status: "draft",
    nl: {
      title: "Uitschrijving",
      description: "Verwerk de uitschrijving van een lid bij LOHC.",
      keywords: ["uitschrijven", "opzegging", "lidmaatschap", "junioren", "senioren", "trimmer"]
    },
    en: {
      title: "Deregistration",
      description: "Process a member's deregistration from LOHC.",
      keywords: ["deregister", "cancellation", "membership", "juniors", "seniors", "trim hockey"]
    }
  },
  {
    id: "gebruikersaanvraag",
    file: "flows/gebruikersaanvraag.json",
    category: "it-support",
    status: "draft",
    nl: {
      title: "Nieuwe gebruikersaanvraag",
      description: "Verwerk een gebruikersaanvraag voor toegang tot Lisa.",
      keywords: ["gebruiker", "aanvraag", "toegang", "lisa", "profiel", "autorisatie"]
    },
    en: {
      title: "New user application",
      description: "Process a user application for access to Lisa.",
      keywords: ["user", "application", "access", "lisa", "profile", "authorization"]
    }
  }
];
