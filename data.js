export const categories = [
  {
    id: "ledenadministratie",
    icon: "♙",
    nl: { title: "Ledenadministratie", description: "Inschrijven, uitschrijven en wijzigingen van leden." },
    en: { title: "Membership", description: "Registrations, cancellations and member changes." }
  },
  {
    id: "teams",
    icon: "♟",
    nl: { title: "Teams & indeling", description: "Teamindeling, invallers en begeleiding." },
    en: { title: "Teams & allocation", description: "Team allocation, substitutes and supervision." }
  },
  {
    id: "vrijwilligers",
    icon: "♡",
    nl: { title: "Vrijwilligers", description: "Aanmelden, VOG en vrijwilligersfuncties." },
    en: { title: "Volunteers", description: "Registration, background checks and volunteer roles." }
  },
  {
    id: "wedstrijden",
    icon: "⚑",
    nl: { title: "Wedstrijden", description: "Wedstrijdzaken, arbitrage en wedstrijdwijzigingen." },
    en: { title: "Matches", description: "Match operations, refereeing and schedule changes." }
  },
  {
    id: "financien",
    icon: "€",
    nl: { title: "Financiën", description: "Contributie, declaraties en betalingen." },
    en: { title: "Finance", description: "Fees, expenses and payments." }
  },
  {
    id: "accommodatie",
    icon: "⌂",
    nl: { title: "Accommodatie", description: "Clubhuis, velden, materialen en storingen." },
    en: { title: "Facilities", description: "Clubhouse, pitches, equipment and faults." }
  }
];

export const flows = [
  {
    id: "nieuwe-inschrijving",
    category: "ledenadministratie",
    owner: { nl: "Ledenadministratie", en: "Membership administration" },
    reviewed: "2026-07-01",
    status: "draft",
    nl: {
      title: "Nieuwe inschrijving",
      description: "Verwerk een nieuwe inschrijving, bepaal het juiste vervolg en informeer alle betrokkenen.",
      keywords: ["inschrijven", "nieuw lid", "aanmelden", "vrijwilliger", "wachtlijst", "g-hockey", "trimmer"],
      steps: [
        { type: "start", title: "Nieuwe inschrijving ontvangen" },
        { type: "decision", title: "Bestaat deze persoon al?", branches: ["Ja — voeg de personen samen", "Nee — ga verder"] },
        { type: "action", title: "Persoonsgegevens controleren", detail: "Vink bij Persoon bewerken het factuuradres aan." },
        {
          type: "decision",
          title: "Is dit een vrijwilliger?",
          branches: [
            {
              label: "Ja",
              title: "Bevestigen",
              detail: "Klik op ‘Bevestigen’ in de ledenadministratie en informeer de VOG-functionaris.",
              outcome: "Proces afgerond",
              terminal: true
            },
            { label: "Nee", title: "Bepaal de spelvorm", continues: true }
          ]
        },
        { type: "decision", title: "Trimmer of G-hockey?", branches: ["Ja — wijs direct lidmaatschap toe", "Nee — plaats op de wachtlijst"] },
        { type: "action", title: "Lidmaatschap toewijzen", detail: "Plaats het lid in het juiste team." },
        { type: "action", title: "Welkomstmail en wachtwoordmail versturen" },
        { type: "decision", title: "Is het lid een trimmer?", branches: ["Ja — mail het juiste trimteam", "Nee — maak Noor-campagne aan en informeer G-hockey"] },
        { type: "notice", title: "Betrokken lijn informeren", detail: "Gebruik de leeftijdslijn en contactlijst hiernaast." },
        { type: "end", title: "Inschrijving verwerkt" }
      ]
    },
    en: {
      title: "New registration",
      description: "Process a new registration, determine the correct route and inform everyone involved.",
      keywords: ["registration", "new member", "volunteer", "waiting list", "g-hockey", "trim hockey"],
      steps: [
        { type: "start", title: "New registration received" },
        { type: "decision", title: "Does this person already exist?", branches: ["Yes — merge the records", "No — continue"] },
        { type: "action", title: "Check personal details", detail: "Select the billing-address option when editing the person." },
        {
          type: "decision",
          title: "Is this a volunteer?",
          branches: [
            {
              label: "Yes",
              title: "Confirm",
              detail: "Click ‘Confirm’ in membership administration and inform the screening officer.",
              outcome: "Process complete",
              terminal: true
            },
            { label: "No", title: "Determine the playing format", continues: true }
          ]
        },
        { type: "decision", title: "Trim hockey or G-hockey?", branches: ["Yes — assign membership directly", "No — add to the waiting list"] },
        { type: "action", title: "Assign membership", detail: "Place the member in the appropriate team." },
        { type: "action", title: "Send welcome and password emails" },
        { type: "decision", title: "Is the member a trim-hockey player?", branches: ["Yes — email the correct trim team", "No — create the Noor campaign and inform G-hockey"] },
        { type: "notice", title: "Inform the relevant age group", detail: "Use the age group and contact list shown alongside." },
        { type: "end", title: "Registration processed" }
      ]
    },
    contacts: [
      { nl: "VOG-functionaris", en: "Screening officer", email: "vog@lohc.nl" },
      { nl: "G-hockey", en: "G-hockey", email: "g-hockey@lohc.nl" },
      { nl: "Hockeyschool t/m O9", en: "Hockey school through U9", email: "secr.hockeyschool@lohc.nl" },
      { nl: "Ontwikkellijn O10–O12", en: "Development U10–U12", email: "ontwikkeling@lohc.nl" },
      { nl: "Hockeyacademie O14–O18", en: "Hockey academy U14–U18", email: "hockeyacademie@lohc.nl" },
      { nl: "Senioren", en: "Seniors", email: "sec@lohc.nl" }
    ]
  }
];
