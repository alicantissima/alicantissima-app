


export const SUPPORTED_LANGUAGES = [
  "es",
  "en",
  "fr",
  "it",
  "no",
  "de",
  "pl",
  "sv",
  "fi",
  "da",
  "hu",
  "pt",
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export function isSupportedLanguage(value: string): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}

export function normalizeLanguage(value?: string | null): AppLanguage {
  if (!value) return DEFAULT_LANGUAGE;

  const normalized = value.trim().toLowerCase();
  return isSupportedLanguage(normalized) ? normalized : DEFAULT_LANGUAGE;
}

type Messages = {
  bookingPassTitle: string;
  showAtReception: string;
  checkInQr: string;
  paymentOnSite: string;
  customer: string;
  serviceDate: string;
  total: string;
  products: string;
  checkIn: string;
  checkOut: string;
  notes: string;
  moreBookingDetails: string;
  bookingCode: string;
  email: string;
  phone: string;
  reservationCreated: string;
  confirmed: string;
  checkedIn: string;
  completed: string;
  cancelled: string;
  fullBrightnessQr: string;
  tapAnywhereToClose: string;
};

const messages: Record<AppLanguage, Messages> = {
  en: {
    bookingPassTitle: "Alicantissima Booking Pass",
    showAtReception: "Show this screen at reception for faster check-in.",
    checkInQr: "Check-in QR",
    paymentOnSite: "Payment is made on site, by card or cash.",
    customer: "Customer",
    serviceDate: "Service date",
    total: "Total",
    products: "Products",
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Notes",
    moreBookingDetails: "More booking details",
    bookingCode: "Booking code",
    email: "Email",
    phone: "Phone",
    reservationCreated: "Reservation created",
    confirmed: "Confirmed",
    checkedIn: "Checked-in",
    completed: "Completed",
    cancelled: "Cancelled",
    fullBrightnessQr: "Full brightness QR",
    tapAnywhereToClose: "Tap anywhere to close",
  },

  es: {
    bookingPassTitle: "Pase de reserva Alicantissima",
    showAtReception: "Muestra esta pantalla en recepción para un check-in más rápido.",
    checkInQr: "QR de check-in",
    paymentOnSite: "El pago se realiza en el local, con tarjeta o en efectivo.",
    customer: "Cliente",
    serviceDate: "Fecha del servicio",
    total: "Total",
    products: "Productos",
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Notas",
    moreBookingDetails: "Más detalles de la reserva",
    bookingCode: "Código de reserva",
    email: "Email",
    phone: "Teléfono",
    reservationCreated: "Reserva creada",
    confirmed: "Confirmada",
    checkedIn: "Check-in realizado",
    completed: "Completada",
    cancelled: "Cancelada",
    fullBrightnessQr: "QR con brillo máximo",
    tapAnywhereToClose: "Toca en cualquier parte para cerrar",
  },

  pt: {
    bookingPassTitle: "Passe de reserva Alicantissima",
    showAtReception: "Mostra este ecrã na receção para um check-in mais rápido.",
    checkInQr: "QR de check-in",
    paymentOnSite: "O pagamento é feito no local, com cartão ou dinheiro.",
    customer: "Cliente",
    serviceDate: "Data do serviço",
    total: "Total",
    products: "Produtos",
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Notas",
    moreBookingDetails: "Mais detalhes da reserva",
    bookingCode: "Código da reserva",
    email: "Email",
    phone: "Telefone",
    reservationCreated: "Reserva criada",
    confirmed: "Confirmada",
    checkedIn: "Check-in feito",
    completed: "Concluída",
    cancelled: "Cancelada",
    fullBrightnessQr: "QR com brilho máximo",
    tapAnywhereToClose: "Toque em qualquer lado para fechar",
  },

  fr: {
    bookingPassTitle: "Pass de réservation Alicantissima",
    showAtReception: "Montrez cet écran à la réception pour un check-in plus rapide.",
    checkInQr: "QR de check-in",
    paymentOnSite: "Le paiement s'effectue sur place, par carte ou en espèces.",
    customer: "Client",
    serviceDate: "Date du service",
    total: "Total",
    products: "Produits",
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Notes",
    moreBookingDetails: "Plus de détails de la réservation",
    bookingCode: "Code de réservation",
    email: "Email",
    phone: "Téléphone",
    reservationCreated: "Réservation créée",
    confirmed: "Confirmée",
    checkedIn: "Check-in effectué",
    completed: "Terminée",
    cancelled: "Annulée",
    fullBrightnessQr: "QR luminosité maximale",
    tapAnywhereToClose: "Touchez n'importe où pour fermer",
  },

  it: {
    bookingPassTitle: "Pass prenotazione Alicantissima",
    showAtReception: "Mostra questa schermata alla reception per un check-in più rapido.",
    checkInQr: "QR di check-in",
    paymentOnSite: "Il pagamento si effettua in loco, con carta o contanti.",
    customer: "Cliente",
    serviceDate: "Data del servizio",
    total: "Totale",
    products: "Prodotti",
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Note",
    moreBookingDetails: "Più dettagli sulla prenotazione",
    bookingCode: "Codice prenotazione",
    email: "Email",
    phone: "Telefono",
    reservationCreated: "Prenotazione creata",
    confirmed: "Confermata",
    checkedIn: "Check-in effettuato",
    completed: "Completata",
    cancelled: "Annullata",
    fullBrightnessQr: "QR luminosità massima",
    tapAnywhereToClose: "Tocca ovunque per chiudere",
  },

  no: {
    bookingPassTitle: "Alicantissima bookingpass",
    showAtReception: "Vis denne skjermen i resepsjonen for raskere innsjekking.",
    checkInQr: "Innsjekkings-QR",
    paymentOnSite: "Betaling skjer på stedet, med kort eller kontanter.",
    customer: "Kunde",
    serviceDate: "Servicedato",
    total: "Totalt",
    products: "Produkter",
    checkIn: "Innsjekking",
    checkOut: "Utsjekking",
    notes: "Notater",
    moreBookingDetails: "Flere reservasjonsdetaljer",
    bookingCode: "Reservasjonskode",
    email: "E-post",
    phone: "Telefon",
    reservationCreated: "Reservasjon opprettet",
    confirmed: "Bekreftet",
    checkedIn: "Sjekket inn",
    completed: "Fullført",
    cancelled: "Avbestilt",
    fullBrightnessQr: "QR med maks lysstyrke",
    tapAnywhereToClose: "Trykk hvor som helst for å lukke",
  },

  de: {
    bookingPassTitle: "Alicantissima Buchungspass",
    showAtReception: "Zeige diesen Bildschirm an der Rezeption für einen schnelleren Check-in.",
    checkInQr: "Check-in-QR",
    paymentOnSite: "Die Zahlung erfolgt vor Ort, per Karte oder bar.",
    customer: "Kunde",
    serviceDate: "Servicedatum",
    total: "Gesamt",
    products: "Produkte",
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Notizen",
    moreBookingDetails: "Weitere Buchungsdetails",
    bookingCode: "Buchungscode",
    email: "E-Mail",
    phone: "Telefon",
    reservationCreated: "Reservierung erstellt",
    confirmed: "Bestätigt",
    checkedIn: "Eingecheckt",
    completed: "Abgeschlossen",
    cancelled: "Storniert",
    fullBrightnessQr: "QR mit maximaler Helligkeit",
    tapAnywhereToClose: "Zum Schließen irgendwo tippen",
  },

  pl: {
    bookingPassTitle: "Karta rezerwacji Alicantissima",
    showAtReception: "Pokaż ten ekran w recepcji, aby przyspieszyć check-in.",
    checkInQr: "QR do check-in",
    paymentOnSite: "Płatność odbywa się na miejscu, kartą lub gotówką.",
    customer: "Klient",
    serviceDate: "Data usługi",
    total: "Łącznie",
    products: "Produkty",
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Uwagi",
    moreBookingDetails: "Więcej szczegółów rezerwacji",
    bookingCode: "Kod rezerwacji",
    email: "Email",
    phone: "Telefon",
    reservationCreated: "Rezerwacja utworzona",
    confirmed: "Potwierdzona",
    checkedIn: "Po check-in",
    completed: "Zakończona",
    cancelled: "Anulowana",
    fullBrightnessQr: "QR z maksymalną jasnością",
    tapAnywhereToClose: "Dotknij gdziekolwiek, aby zamknąć",
  },

  sv: {
    bookingPassTitle: "Alicantissima bokningspass",
    showAtReception: "Visa denna skärm i receptionen för snabbare incheckning.",
    checkInQr: "Inchecknings-QR",
    paymentOnSite: "Betalning sker på plats, med kort eller kontanter.",
    customer: "Kund",
    serviceDate: "Servicedatum",
    total: "Totalt",
    products: "Produkter",
    checkIn: "Incheckning",
    checkOut: "Utcheckning",
    notes: "Anteckningar",
    moreBookingDetails: "Fler bokningsdetaljer",
    bookingCode: "Bokningskod",
    email: "E-post",
    phone: "Telefon",
    reservationCreated: "Bokning skapad",
    confirmed: "Bekräftad",
    checkedIn: "Incheckad",
    completed: "Slutförd",
    cancelled: "Avbokad",
    fullBrightnessQr: "QR med maximal ljusstyrka",
    tapAnywhereToClose: "Tryck var som helst för att stänga",
  },

  fi: {
    bookingPassTitle: "Alicantissima varauspassi",
    showAtReception: "Näytä tämä näyttö vastaanotossa nopeampaa sisäänkirjautumista varten.",
    checkInQr: "Sisäänkirjautumisen QR",
    paymentOnSite: "Maksu suoritetaan paikan päällä kortilla tai käteisellä.",
    customer: "Asiakas",
    serviceDate: "Palvelupäivä",
    total: "Yhteensä",
    products: "Tuotteet",
    checkIn: "Sisäänkirjautuminen",
    checkOut: "Uloskirjautuminen",
    notes: "Huomautukset",
    moreBookingDetails: "Lisää varauksen tietoja",
    bookingCode: "Varauskoodi",
    email: "Sähköposti",
    phone: "Puhelin",
    reservationCreated: "Varaus luotu",
    confirmed: "Vahvistettu",
    checkedIn: "Sisäänkirjattu",
    completed: "Valmis",
    cancelled: "Peruutettu",
    fullBrightnessQr: "QR täydellä kirkkaudella",
    tapAnywhereToClose: "Sulje napauttamalla mitä tahansa kohtaa",
  },

  da: {
    bookingPassTitle: "Alicantissima bookingpas",
    showAtReception: "Vis denne skærm i receptionen for hurtigere check-in.",
    checkInQr: "Check-in QR",
    paymentOnSite: "Betaling sker på stedet med kort eller kontanter.",
    customer: "Kunde",
    serviceDate: "Servicedato",
    total: "Total",
    products: "Produkter",
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Noter",
    moreBookingDetails: "Flere reservationsdetaljer",
    bookingCode: "Reservationskode",
    email: "Email",
    phone: "Telefon",
    reservationCreated: "Reservation oprettet",
    confirmed: "Bekræftet",
    checkedIn: "Checket ind",
    completed: "Afsluttet",
    cancelled: "Annulleret",
    fullBrightnessQr: "QR med maksimal lysstyrke",
    tapAnywhereToClose: "Tryk hvor som helst for at lukke",
  },

  hu: {
    bookingPassTitle: "Alicantissima foglalási bérlet",
    showAtReception: "Mutasd meg ezt a képernyőt a recepción a gyorsabb check-inhez.",
    checkInQr: "Check-in QR",
    paymentOnSite: "A fizetés a helyszínen történik, kártyával vagy készpénzzel.",
    customer: "Ügyfél",
    serviceDate: "Szolgáltatás dátuma",
    total: "Összesen",
    products: "Termékek",
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Megjegyzések",
    moreBookingDetails: "További foglalási részletek",
    bookingCode: "Foglalási kód",
    email: "Email",
    phone: "Telefon",
    reservationCreated: "Foglalás létrehozva",
    confirmed: "Megerősítve",
    checkedIn: "Bejelentkezve",
    completed: "Befejezve",
    cancelled: "Törölve",
    fullBrightnessQr: "QR maximális fényerővel",
    tapAnywhereToClose: "Koppints bárhová a bezáráshoz",
  },
};

export function getMessages(language?: string | null) {
  return messages[normalizeLanguage(language)];
}