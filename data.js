export const categories = [
  { id: "ledenadministratie", icon: "♙", nl: { title: "Ledenadministratie", description: "Inschrijven, uitschrijven en wijzigingen van leden." }, en: { title: "Membership", description: "Registrations, cancellations and member changes." } },
  { id: "teams", icon: "♟", nl: { title: "Teams & indeling", description: "Teamindeling, invallers en begeleiding." }, en: { title: "Teams & allocation", description: "Team allocation, substitutes and supervision." } },
  { id: "vrijwilligers", icon: "♡", nl: { title: "Vrijwilligers", description: "Aanmelden, VOG en vrijwilligersfuncties." }, en: { title: "Volunteers", description: "Registration, background checks and volunteer roles." } },
  { id: "wedstrijden", icon: "⚑", nl: { title: "Wedstrijden", description: "Wedstrijdzaken, arbitrage en wedstrijdwijzigingen." }, en: { title: "Matches", description: "Match operations, refereeing and schedule changes." } },
  { id: "financien", icon: "€", nl: { title: "Financiën", description: "Contributie, declaraties en betalingen." }, en: { title: "Finance", description: "Fees, expenses and payments." } },
  { id: "accommodatie", icon: "⌂", nl: { title: "Accommodatie", description: "Clubhuis, velden, materialen en storingen." }, en: { title: "Facilities", description: "Clubhouse, pitches, equipment and faults." } }
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
  }
];
