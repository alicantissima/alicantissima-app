


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

  back: string;
  bookLuggageTitle: string;
  bookLuggageSubtitle: string;
  chooseDate: string;
  chooseDropOffTime: string;
  estimatedPickUpTime: string;
  pickUpHelpText: string;
  numberOfLuggage: string;
  totalPrice: string;
  bookNow: string;
  commentsOptional: string;

  bookLuggageChooseDateAlert: string;
  bookLuggageChooseDropOffAlert: string;
  bookLuggageChoosePickUpAlert: string;
  bookLuggageProductName: string;

  bookingConfirmedTitle: string;
  bookingCodeNotFound: string;
  backToBooking: string;
  thankYouBookingCodePrefix: string;
  keepCodeForCheckIn: string;
  confirmationEmailSent: string;
  bookingSummary: string;
  nameLabel: string;
  dateLabel: string;
  dropOffLabel: string;
  estimatedPickUpLabel: string;
  showerTimeLabel: string;
  qtyLabel: string;
  totalLabel: string;
  showQrAtReception: string;
  qrAltPrefix: string;
  itemFallback: string;

  checkoutEmpty: string;
  backToProductMenu: string;
  cityLabel: string;
  cityPlaceholder: string;
  createBooking: string;
  creatingBooking: string;
  checkoutError: string;
};

const baseMessages: Messages = {
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


  back: "Back",
  bookLuggageTitle: "Store Luggage",
  bookLuggageSubtitle: "Safe & fast luggage storage in Alicante city center",
  chooseDate: "Choose date",
  chooseDropOffTime: "Choose drop-off time",
  estimatedPickUpTime: "Estimated pick-up time",
  pickUpHelpText: "Helps us organize luggage during the day.",
  numberOfLuggage: "Number of luggage",
  totalPrice: "Total price",
  bookNow: "Book now",
  commentsOptional: "Comments (optional)",

  bookLuggageChooseDateAlert: "Please choose a date.",
  bookLuggageChooseDropOffAlert: "Please choose a drop-off time.",
  bookLuggageChoosePickUpAlert: "Please choose an estimated pick-up time.",
  bookLuggageProductName: "Store Luggage",

  bookingConfirmedTitle: "Booking confirmed",
  bookingCodeNotFound: "Booking code not found.",
  backToBooking: "Back to booking",
  thankYouBookingCodePrefix: "Thank you. Your booking code is",
  keepCodeForCheckIn: "Please keep this code for check-in.",
  confirmationEmailSent: "A confirmation email has been sent to you.",
  bookingSummary: "Booking summary",
  nameLabel: "Name:",
  dateLabel: "Date:",
  dropOffLabel: "Drop-off:",
  estimatedPickUpLabel: "Estimated pick-up:",
  showerTimeLabel: "Shower time:",
  qtyLabel: "Qty:",
  totalLabel: "Total:",
  showQrAtReception: "Show this QR code at reception for faster check-in.",
  qrAltPrefix: "QR code for booking",
  itemFallback: "Item",

  checkoutEmpty: "Your booking is empty.",
  backToProductMenu: "Back to product menu",
  cityLabel: "City (where you are from)",
  cityPlaceholder: "London, Berlin, Madrid...",
  createBooking: "Create booking",
  creatingBooking: "Creating booking...",
  checkoutError: "An error occurred during checkout.",



  bookShowerTitle: "Take a Shower",
  bookShowerSubtitle: "Refresh yourself before your trip or after the beach",
  chooseShowerTime: "Choose shower time",
  numberOfShowers: "Number of showers",

  bookShowerChooseDateAlert: "Please choose a date.",
  bookShowerChooseTimeAlert: "Please choose a shower time.",
  bookShowerProductName: "Shower",
};

const messages: Record<AppLanguage, Messages> = {
  en: baseMessages,

  es: {
  ...baseMessages,

  bookingPassTitle: "Pase de reserva Alicantissima",
  showAtReception: "Muestra esta pantalla en recepción para un check-in más rápido.",
  checkInQr: "Código QR de check-in",
  paymentOnSite: "El pago se realiza en el local, con tarjeta o efectivo.",

  back: "Volver",
  backToProductMenu: "Volver al menú de servicios",

  bookLuggageTitle: "Consigna de equipaje",
  bookLuggageSubtitle: "Consigna segura y rápida en el centro de Alicante",

  chooseDate: "Elegir fecha",
  chooseDropOffTime: "Elegir hora de entrega",
  estimatedPickUpTime: "Hora estimada de recogida",

  numberOfLuggage: "Número de maletas",

  totalPrice: "Precio total",

  bookNow: "Reservar ahora",

  commentsOptional: "Comentarios (opcional)",

  nameLabel: "Nombre y apellido:",
  cityLabel: "Ciudad (de dónde vienes)",
  cityPlaceholder: "Londres, Berlín, Madrid...",

  email: "Email",
  phone: "Teléfono",

  createBooking: "Crear reserva",
  creatingBooking: "Creando reserva...",

  checkoutEmpty: "Tu reserva está vacía.",

  bookingSummary: "Resumen de la reserva",

  dateLabel: "Fecha:",
  dropOffLabel: "Entrega:",
  estimatedPickUpLabel: "Recogida estimada:",
  showerTimeLabel: "Hora de ducha:",

  qtyLabel: "Cantidad:",
  totalLabel: "Total:",

  checkoutError: "Se produjo un error durante la reserva.",
},

    pt: {
    ...baseMessages,
    bookingPassTitle: "Passe de reserva Alicantissima",
    showAtReception: "Mostra este ecrã na receção para um check-in mais rápido.",
    checkInQr: "QR de check-in",
    paymentOnSite: "O pagamento é feito no local, por cartão ou dinheiro.",
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
    checkedIn: "Check-in realizado",
    completed: "Concluída",
    cancelled: "Cancelada",
    fullBrightnessQr: "QR com brilho máximo",
    tapAnywhereToClose: "Toca em qualquer lado para fechar",

    back: "Voltar",
    backToProductMenu: "Voltar ao menu de serviços",

    bookLuggageTitle: "Guardar bagagem",
    bookLuggageSubtitle: "Guarda de bagagem rápida e segura no centro de Alicante",
    chooseDate: "Escolher data",
    chooseDropOffTime: "Escolher hora de entrega",
    estimatedPickUpTime: "Hora estimada de recolha",
    pickUpHelpText: "Ajuda-nos a organizar a bagagem durante o dia.",
    numberOfLuggage: "Número de malas",
    totalPrice: "Preço total",
    bookNow: "Reservar agora",
    commentsOptional: "Comentários (opcional)",

    bookLuggageChooseDateAlert: "Por favor, escolhe uma data.",
    bookLuggageChooseDropOffAlert: "Por favor, escolhe uma hora de entrega.",
    bookLuggageChoosePickUpAlert: "Por favor, escolhe uma hora estimada de recolha.",
    bookLuggageProductName: "Guardar bagagem",

  bookShowerTitle: string;
  bookShowerSubtitle: string;
  chooseShowerTime: string;
  numberOfShowers: string;

  bookShowerChooseDateAlert: string;
  bookShowerChooseTimeAlert: string;
  bookShowerProductName: string;

    bookingConfirmedTitle: "Reserva confirmada",
    bookingCodeNotFound: "Código de reserva não encontrado.",
    backToBooking: "Voltar à reserva",
    thankYouBookingCodePrefix: "Obrigado. O teu código de reserva é",
    keepCodeForCheckIn: "Guarda este código para o check-in.",
    confirmationEmailSent: "Foi enviado um email de confirmação.",
    bookingSummary: "Resumo da reserva",
    nameLabel: "Nome e apelido:",
    dateLabel: "Data:",
    dropOffLabel: "Entrega:",
    estimatedPickUpLabel: "Recolha estimada:",
    showerTimeLabel: "Hora do duche:",
    qtyLabel: "Qtd.:",
    totalLabel: "Total:",
    showQrAtReception: "Mostra este código QR na receção para um check-in mais rápido.",
    qrAltPrefix: "Código QR da reserva",
    itemFallback: "Item",

    checkoutEmpty: "A tua reserva está vazia.",
    cityLabel: "Cidade (de onde vens)",
    cityPlaceholder: "Lisboa, Porto, Madrid...",
    createBooking: "Criar reserva",
    creatingBooking: "A criar reserva...",
    checkoutError: "Ocorreu um erro durante a reserva.",
  },,

  fr: {
  ...baseMessages,

  back: "Retour",
  backToProductMenu: "Retour au choix du service",

  bookLuggageTitle: "Consigne à bagages",
  bookLuggageSubtitle: "Consigne rapide et sécurisée au centre d'Alicante",

  chooseDate: "Choisir la date",
  chooseDropOffTime: "Choisir l'heure de dépôt",
  estimatedPickUpTime: "Heure estimée de récupération",

  numberOfLuggage: "Nombre de bagages",

  totalPrice: "Prix total",

  bookNow: "Réserver maintenant",

  commentsOptional: "Commentaires (optionnel)",

  nameLabel: "Nom et prénom:",
  cityLabel: "Ville (d'où vous venez)",
  cityPlaceholder: "Paris, Berlin, Madrid...",

  email: "Email",
  phone: "Téléphone",

  createBooking: "Créer la réservation",
  creatingBooking: "Création de la réservation...",

  checkoutEmpty: "Votre réservation est vide.",

  bookingSummary: "Résumé de la réservation",

  dateLabel: "Date:",
  dropOffLabel: "Dépôt:",
  estimatedPickUpLabel: "Récupération estimée:",
  showerTimeLabel: "Heure de douche:",

  qtyLabel: "Quantité:",
  totalLabel: "Total:",

  checkoutError: "Une erreur s'est produite lors de la réservation.",
},
  it: {
  ...baseMessages,

  bookingPassTitle: "Pass prenotazione Alicantissima",
  showAtReception: "Mostra questa schermata alla reception per un check-in più rapido.",
  checkInQr: "QR per il check-in",
  paymentOnSite: "Il pagamento avviene in loco, con carta o contanti.",
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
  fullBrightnessQr: "QR con luminosità massima",
  tapAnywhereToClose: "Tocca ovunque per chiudere",

  back: "Indietro",
  backToProductMenu: "Torna alla scelta del servizio",

  bookLuggageTitle: "Deposito bagagli",
  bookLuggageSubtitle: "Deposito bagagli sicuro e veloce nel centro di Alicante",
  chooseDate: "Scegli la data",
  chooseDropOffTime: "Scegli l'orario di consegna",
  estimatedPickUpTime: "Orario stimato di ritiro",
  pickUpHelpText: "Ci aiuta a organizzare i bagagli durante la giornata.",
  numberOfLuggage: "Numero di bagagli",
  totalPrice: "Prezzo totale",
  bookNow: "Prenota ora",
  commentsOptional: "Commenti (opzionale)",

  bookLuggageChooseDateAlert: "Per favore, scegli una data.",
  bookLuggageChooseDropOffAlert: "Per favore, scegli un orario di consegna.",
  bookLuggageChoosePickUpAlert: "Per favore, scegli un orario stimato di ritiro.",
  bookLuggageProductName: "Deposito bagagli",

  bookingConfirmedTitle: "Prenotazione confermata",
  bookingCodeNotFound: "Codice prenotazione non trovato.",
  backToBooking: "Torna alla prenotazione",
  thankYouBookingCodePrefix: "Grazie. Il tuo codice prenotazione è",
  keepCodeForCheckIn: "Conserva questo codice per il check-in.",
  confirmationEmailSent: "Ti abbiamo inviato un'email di conferma.",
  bookingSummary: "Riepilogo prenotazione",
  nameLabel: "Nome e cognome:",
  dateLabel: "Data:",
  dropOffLabel: "Consegna:",
  estimatedPickUpLabel: "Ritiro stimato:",
  showerTimeLabel: "Orario doccia:",
  qtyLabel: "Quantità:",
  totalLabel: "Totale:",
  showQrAtReception: "Mostra questo codice QR alla reception per un check-in più rapido.",
  qrAltPrefix: "Codice QR per la prenotazione",
  itemFallback: "Voce",

  checkoutEmpty: "La tua prenotazione è vuota.",
  cityLabel: "Città (da dove vieni)",
  cityPlaceholder: "Roma, Berlino, Madrid...",
  createBooking: "Crea prenotazione",
  creatingBooking: "Creazione prenotazione...",
  checkoutError: "Si è verificato un errore durante la prenotazione.",
},
  no: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima reservasjonskort",
    showAtReception: "Vis denne skjermen i resepsjonen for raskere innsjekking.",
    checkInQr: "QR-kode for innsjekking",
    paymentOnSite: "Betaling skjer på stedet, med kort eller kontanter.",
    customer: "Kunde",
    serviceDate: "Tjenestedato",
    total: "Totalt",
    products: "Produkter",
    checkIn: "Innsjekking",
    checkOut: "Utsjekking",
    notes: "Notater",
    moreBookingDetails: "Flere bestillingsdetaljer",
    bookingCode: "Bestillingskode",
    email: "E-post",
    phone: "Telefon",
    reservationCreated: "Bestilling opprettet",
    confirmed: "Bekreftet",
    checkedIn: "Sjekket inn",
    completed: "Fullført",
    cancelled: "Avbestilt",
    fullBrightnessQr: "QR med maksimal lysstyrke",
    tapAnywhereToClose: "Trykk hvor som helst for å lukke",

    back: "Tilbake",
    backToProductMenu: "Tilbake til tjenestemenyen",

    bookLuggageTitle: "Bagasjeoppbevaring",
    bookLuggageSubtitle: "Trygg og rask bagasjeoppbevaring i Alicante sentrum",
    chooseDate: "Velg dato",
    chooseDropOffTime: "Velg leveringstid",
    estimatedPickUpTime: "Estimert hentetid",
    pickUpHelpText: "Dette hjelper oss med å organisere bagasjen gjennom dagen.",
    numberOfLuggage: "Antall bagasjeenheter",
    totalPrice: "Totalpris",
    bookNow: "Bestill nå",
    commentsOptional: "Kommentarer (valgfritt)",

    bookLuggageChooseDateAlert: "Vennligst velg en dato.",
    bookLuggageChooseDropOffAlert: "Vennligst velg leveringstid.",
    bookLuggageChoosePickUpAlert: "Vennligst velg estimert hentetid.",
    bookLuggageProductName: "Bagasjeoppbevaring",

    bookingConfirmedTitle: "Bestilling bekreftet",
    bookingCodeNotFound: "Bestillingskode ikke funnet.",
    backToBooking: "Tilbake til bestillingen",
    thankYouBookingCodePrefix: "Takk. Din bestillingskode er",
    keepCodeForCheckIn: "Ta vare på denne koden for innsjekking.",
    confirmationEmailSent: "En bekreftelsesmail er sendt til deg.",
    bookingSummary: "Bestillingsoversikt",
    nameLabel: "Navn og etternavn:",
    dateLabel: "Dato:",
    dropOffLabel: "Levering:",
    estimatedPickUpLabel: "Estimert henting:",
    showerTimeLabel: "Dusjtid:",
    qtyLabel: "Antall:",
    totalLabel: "Totalt:",
    showQrAtReception: "Vis denne QR-koden i resepsjonen for raskere innsjekking.",
    qrAltPrefix: "QR-kode for bestilling",
    itemFallback: "Vare",

    checkoutEmpty: "Bestillingen din er tom.",
    cityLabel: "By (hvor du kommer fra)",
    cityPlaceholder: "Oslo, Berlin, Madrid...",
    createBooking: "Opprett bestilling",
    creatingBooking: "Oppretter bestilling...",
    checkoutError: "Det oppstod en feil under bestillingen.",
  },
  de: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima Buchungspass",
    showAtReception: "Zeige diesen Bildschirm an der Rezeption für einen schnelleren Check-in.",
    checkInQr: "Check-in QR-Code",
    paymentOnSite: "Die Zahlung erfolgt vor Ort, mit Karte oder Bargeld.",
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
    reservationCreated: "Buchung erstellt",
    confirmed: "Bestätigt",
    checkedIn: "Eingecheckt",
    completed: "Abgeschlossen",
    cancelled: "Storniert",
    fullBrightnessQr: "QR mit voller Helligkeit",
    tapAnywhereToClose: "Zum Schließen irgendwo tippen",

    back: "Zurück",
    backToProductMenu: "Zurück zum Servicemenü",

    bookLuggageTitle: "Gepäckaufbewahrung",
    bookLuggageSubtitle: "Sichere und schnelle Gepäckaufbewahrung im Zentrum von Alicante",
    chooseDate: "Datum wählen",
    chooseDropOffTime: "Abgabezeit wählen",
    estimatedPickUpTime: "Geschätzte Abholzeit",
    pickUpHelpText: "Hilft uns, das Gepäck im Laufe des Tages zu organisieren.",
    numberOfLuggage: "Anzahl Gepäckstücke",
    totalPrice: "Gesamtpreis",
    bookNow: "Jetzt buchen",
    commentsOptional: "Kommentare (optional)",

    bookLuggageChooseDateAlert: "Bitte wähle ein Datum.",
    bookLuggageChooseDropOffAlert: "Bitte wähle eine Abgabezeit.",
    bookLuggageChoosePickUpAlert: "Bitte wähle eine geschätzte Abholzeit.",
    bookLuggageProductName: "Gepäckaufbewahrung",

    bookingConfirmedTitle: "Buchung bestätigt",
    bookingCodeNotFound: "Buchungscode nicht gefunden.",
    backToBooking: "Zurück zur Buchung",
    thankYouBookingCodePrefix: "Danke. Dein Buchungscode ist",
    keepCodeForCheckIn: "Bitte bewahre diesen Code für den Check-in auf.",
    confirmationEmailSent: "Eine Bestätigungs-E-Mail wurde an dich gesendet.",
    bookingSummary: "Buchungsübersicht",
    nameLabel: "Vor- und Nachname:",
    dateLabel: "Datum:",
    dropOffLabel: "Abgabe:",
    estimatedPickUpLabel: "Geschätzte Abholung:",
    showerTimeLabel: "Duschzeit:",
    qtyLabel: "Menge:",
    totalLabel: "Gesamt:",
    showQrAtReception: "Zeige diesen QR-Code an der Rezeption für einen schnelleren Check-in.",
    qrAltPrefix: "QR-Code für Buchung",
    itemFallback: "Artikel",

    checkoutEmpty: "Deine Buchung ist leer.",
    cityLabel: "Stadt (woher du kommst)",
    cityPlaceholder: "Berlin, London, Madrid...",
    createBooking: "Buchung erstellen",
    creatingBooking: "Buchung wird erstellt...",
    checkoutError: "Während der Buchung ist ein Fehler aufgetreten.",
  },
  pl: {
  ...baseMessages,
  bookingPassTitle: "Karta rezerwacji Alicantissima",
  showAtReception: "Pokaż ten ekran w recepcji, aby przyspieszyć check-in.",
  checkInQr: "Kod QR do check-in",
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

  back: "Powrót",
  bookLuggageTitle: "Przechowalnia bagażu",
  bookLuggageSubtitle: "Bezpieczna i szybka przechowalnia bagażu w centrum Alicante",
  chooseDate: "Wybierz datę",
  chooseDropOffTime: "Wybierz godzinę pozostawienia",
  estimatedPickUpTime: "Szacowana godzina odbioru",
  pickUpHelpText: "Pomaga nam to organizować bagaż w ciągu dnia.",
  numberOfLuggage: "Liczba sztuk bagażu",
  totalPrice: "Cena całkowita",
  bookNow: "Zarezerwuj teraz",
  commentsOptional: "Komentarze (opcjonalnie)",

  bookLuggageChooseDateAlert: "Proszę wybrać datę.",
  bookLuggageChooseDropOffAlert: "Proszę wybrać godzinę pozostawienia.",
  bookLuggageChoosePickUpAlert: "Proszę wybrać szacowaną godzinę odbioru.",
  bookLuggageProductName: "Przechowalnia bagażu",

  bookingConfirmedTitle: "Rezerwacja potwierdzona",
  bookingCodeNotFound: "Nie znaleziono kodu rezerwacji.",
  backToBooking: "Powrót do rezerwacji",
  thankYouBookingCodePrefix: "Dziękujemy. Twój kod rezerwacji to",
  keepCodeForCheckIn: "Zachowaj ten kod do check-in.",
  confirmationEmailSent: "Wysłano do Ciebie email z potwierdzeniem.",
  bookingSummary: "Podsumowanie rezerwacji",
  nameLabel: "Imię i nazwisko:",
  dateLabel: "Data:",
  dropOffLabel: "Pozostawienie:",
  estimatedPickUpLabel: "Szacowany odbiór:",
  showerTimeLabel: "Godzina prysznica:",
  qtyLabel: "Ilość:",
  totalLabel: "Łącznie:",
  showQrAtReception: "Pokaż ten kod QR w recepcji, aby przyspieszyć check-in.",
  qrAltPrefix: "Kod QR dla rezerwacji",
  itemFallback: "Pozycja",

  checkoutEmpty: "Twoja rezerwacja jest pusta.",
  backToProductMenu: "Powrót do wyboru usługi",
  cityLabel: "Miasto (skąd jesteś)",
  cityPlaceholder: "Londyn, Berlin, Madryt...",
  createBooking: "Utwórz rezerwację",
  creatingBooking: "Tworzenie rezerwacji...",
  checkoutError: "Wystąpił błąd podczas rezerwacji.",
},
  sv: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima bokningspass",
    showAtReception: "Visa denna skärm i receptionen för snabbare incheckning.",
    checkInQr: "QR-kod för incheckning",
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
    fullBrightnessQr: "QR med full ljusstyrka",
    tapAnywhereToClose: "Tryck var som helst för att stänga",

    back: "Tillbaka",
    backToProductMenu: "Tillbaka till tjänstemenyn",

    bookLuggageTitle: "Bagageförvaring",
    bookLuggageSubtitle: "Säker och snabb bagageförvaring i Alicantes centrum",
    chooseDate: "Välj datum",
    chooseDropOffTime: "Välj inlämningstid",
    estimatedPickUpTime: "Beräknad upphämtningstid",
    pickUpHelpText: "Det hjälper oss att organisera bagaget under dagen.",
    numberOfLuggage: "Antal bagage",
    totalPrice: "Totalt pris",
    bookNow: "Boka nu",
    commentsOptional: "Kommentarer (valfritt)",

    bookLuggageChooseDateAlert: "Välj ett datum.",
    bookLuggageChooseDropOffAlert: "Välj en inlämningstid.",
    bookLuggageChoosePickUpAlert: "Välj en beräknad upphämtningstid.",
    bookLuggageProductName: "Bagageförvaring",

    bookingConfirmedTitle: "Bokning bekräftad",
    bookingCodeNotFound: "Bokningskod hittades inte.",
    backToBooking: "Tillbaka till bokningen",
    thankYouBookingCodePrefix: "Tack. Din bokningskod är",
    keepCodeForCheckIn: "Spara denna kod för incheckning.",
    confirmationEmailSent: "Ett bekräftelsemail har skickats till dig.",
    bookingSummary: "Bokningsöversikt",
    nameLabel: "För- och efternamn:",
    dateLabel: "Datum:",
    dropOffLabel: "Inlämning:",
    estimatedPickUpLabel: "Beräknad upphämtning:",
    showerTimeLabel: "Duschtid:",
    qtyLabel: "Antal:",
    totalLabel: "Totalt:",
    showQrAtReception: "Visa denna QR-kod i receptionen för snabbare incheckning.",
    qrAltPrefix: "QR-kod för bokning",
    itemFallback: "Post",

    checkoutEmpty: "Din bokning är tom.",
    cityLabel: "Stad (var du kommer från)",
    cityPlaceholder: "Stockholm, Berlin, Madrid...",
    createBooking: "Skapa bokning",
    creatingBooking: "Skapar bokning...",
    checkoutError: "Ett fel uppstod under bokningen.",
  },
  fi: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima-varauspassi",
    showAtReception: "Näytä tämä näyttö vastaanotossa nopeampaa sisäänkirjautumista varten.",
    checkInQr: "Sisäänkirjautumisen QR-koodi",
    paymentOnSite: "Maksu suoritetaan paikan päällä, kortilla tai käteisellä.",
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
    checkedIn: "Kirjautunut sisään",
    completed: "Valmis",
    cancelled: "Peruutettu",
    fullBrightnessQr: "QR täydellä kirkkaudella",
    tapAnywhereToClose: "Sulje napauttamalla mitä tahansa kohtaa",

    back: "Takaisin",
    backToProductMenu: "Takaisin palveluvalikkoon",

    bookLuggageTitle: "Matkatavarasäilytys",
    bookLuggageSubtitle: "Turvallinen ja nopea matkatavarasäilytys Alicanten keskustassa",
    chooseDate: "Valitse päivämäärä",
    chooseDropOffTime: "Valitse jättöaika",
    estimatedPickUpTime: "Arvioitu noutoaika",
    pickUpHelpText: "Tämä auttaa meitä järjestämään matkatavarat päivän aikana.",
    numberOfLuggage: "Matkatavaroiden määrä",
    totalPrice: "Kokonaishinta",
    bookNow: "Varaa nyt",
    commentsOptional: "Kommentit (valinnainen)",

    bookLuggageChooseDateAlert: "Valitse päivämäärä.",
    bookLuggageChooseDropOffAlert: "Valitse jättöaika.",
    bookLuggageChoosePickUpAlert: "Valitse arvioitu noutoaika.",
    bookLuggageProductName: "Matkatavarasäilytys",

    bookingConfirmedTitle: "Varaus vahvistettu",
    bookingCodeNotFound: "Varauskoodia ei löytynyt.",
    backToBooking: "Takaisin varaukseen",
    thankYouBookingCodePrefix: "Kiitos. Varauskoodisi on",
    keepCodeForCheckIn: "Säilytä tämä koodi sisäänkirjautumista varten.",
    confirmationEmailSent: "Sinulle on lähetetty vahvistussähköposti.",
    bookingSummary: "Varauksen yhteenveto",
    nameLabel: "Etu- ja sukunimi:",
    dateLabel: "Päivämäärä:",
    dropOffLabel: "Jättö:",
    estimatedPickUpLabel: "Arvioitu nouto:",
    showerTimeLabel: "Suihkuaika:",
    qtyLabel: "Määrä:",
    totalLabel: "Yhteensä:",
    showQrAtReception: "Näytä tämä QR-koodi vastaanotossa nopeampaa sisäänkirjautumista varten.",
    qrAltPrefix: "QR-koodi varaukselle",
    itemFallback: "Tuote",

    checkoutEmpty: "Varauksesi on tyhjä.",
    cityLabel: "Kaupunki (mistä olet kotoisin)",
    cityPlaceholder: "Helsinki, Berliini, Madrid...",
    createBooking: "Luo varaus",
    creatingBooking: "Luodaan varausta...",
    checkoutError: "Varauksen aikana tapahtui virhe.",
  },
  da: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima bookingpas",
    showAtReception: "Vis denne skærm i receptionen for hurtigere check-in.",
    checkInQr: "QR-kode til check-in",
    paymentOnSite: "Betaling sker på stedet med kort eller kontanter.",
    customer: "Kunde",
    serviceDate: "Servicedato",
    total: "I alt",
    products: "Produkter",
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Noter",
    moreBookingDetails: "Flere bookingoplysninger",
    bookingCode: "Bookingkode",
    email: "E-mail",
    phone: "Telefon",
    reservationCreated: "Booking oprettet",
    confirmed: "Bekræftet",
    checkedIn: "Tjekket ind",
    completed: "Afsluttet",
    cancelled: "Annulleret",
    fullBrightnessQr: "QR med maksimal lysstyrke",
    tapAnywhereToClose: "Tryk hvor som helst for at lukke",

    back: "Tilbage",
    backToProductMenu: "Tilbage til servicemenuen",

    bookLuggageTitle: "Bagageopbevaring",
    bookLuggageSubtitle: "Sikker og hurtig bagageopbevaring i Alicantes centrum",
    chooseDate: "Vælg dato",
    chooseDropOffTime: "Vælg afleveringstid",
    estimatedPickUpTime: "Forventet afhentningstid",
    pickUpHelpText: "Det hjælper os med at organisere bagagen i løbet af dagen.",
    numberOfLuggage: "Antal stykker bagage",
    totalPrice: "Samlet pris",
    bookNow: "Book nu",
    commentsOptional: "Kommentarer (valgfrit)",

    bookLuggageChooseDateAlert: "Vælg venligst en dato.",
    bookLuggageChooseDropOffAlert: "Vælg venligst et afleveringstidspunkt.",
    bookLuggageChoosePickUpAlert: "Vælg venligst et forventet afhentningstidspunkt.",
    bookLuggageProductName: "Bagageopbevaring",

    bookingConfirmedTitle: "Booking bekræftet",
    bookingCodeNotFound: "Bookingkode ikke fundet.",
    backToBooking: "Tilbage til booking",
    thankYouBookingCodePrefix: "Tak. Din bookingkode er",
    keepCodeForCheckIn: "Gem denne kode til check-in.",
    confirmationEmailSent: "En bekræftelsesmail er blevet sendt til dig.",
    bookingSummary: "Bookingoversigt",
    nameLabel: "For- og efternavn:",
    dateLabel: "Dato:",
    dropOffLabel: "Aflevering:",
    estimatedPickUpLabel: "Forventet afhentning:",
    showerTimeLabel: "Brusetid:",
    qtyLabel: "Antal:",
    totalLabel: "I alt:",
    showQrAtReception: "Vis denne QR-kode i receptionen for hurtigere check-in.",
    qrAltPrefix: "QR-kode til booking",
    itemFallback: "Vare",

    checkoutEmpty: "Din booking er tom.",
    cityLabel: "By (hvor du kommer fra)",
    cityPlaceholder: "København, Berlin, Madrid...",
    createBooking: "Opret booking",
    creatingBooking: "Opretter booking...",
    checkoutError: "Der opstod en fejl under bookingen.",
  },
  hu: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima foglalási belépő",
    showAtReception: "Mutasd meg ezt a képernyőt a recepción a gyorsabb bejelentkezéshez.",
    checkInQr: "Check-in QR-kód",
    paymentOnSite: "A fizetés a helyszínen történik, kártyával vagy készpénzzel.",
    customer: "Ügyfél",
    serviceDate: "Szolgáltatás dátuma",
    total: "Összesen",
    products: "Termékek",
    checkIn: "Bejelentkezés",
    checkOut: "Kijelentkezés",
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
    tapAnywhereToClose: "Bezáráshoz érints meg bárhol",

    back: "Vissza",
    backToProductMenu: "Vissza a szolgáltatások menüjéhez",

    bookLuggageTitle: "Csomagmegőrzés",
    bookLuggageSubtitle: "Biztonságos és gyors csomagmegőrzés Alicante belvárosában",
    chooseDate: "Válassz dátumot",
    chooseDropOffTime: "Válassz leadási időt",
    estimatedPickUpTime: "Becsült átvételi idő",
    pickUpHelpText: "Ez segít nekünk a csomagok napi szervezésében.",
    numberOfLuggage: "Csomagok száma",
    totalPrice: "Teljes ár",
    bookNow: "Foglalás most",
    commentsOptional: "Megjegyzések (opcionális)",

    bookLuggageChooseDateAlert: "Kérlek, válassz dátumot.",
    bookLuggageChooseDropOffAlert: "Kérlek, válassz leadási időt.",
    bookLuggageChoosePickUpAlert: "Kérlek, válassz becsült átvételi időt.",
    bookLuggageProductName: "Csomagmegőrzés",

    bookingConfirmedTitle: "Foglalás megerősítve",
    bookingCodeNotFound: "A foglalási kód nem található.",
    backToBooking: "Vissza a foglaláshoz",
    thankYouBookingCodePrefix: "Köszönjük. A foglalási kódod:",
    keepCodeForCheckIn: "Kérlek, őrizd meg ezt a kódot a check-inhez.",
    confirmationEmailSent: "Visszaigazoló emailt küldtünk neked.",
    bookingSummary: "Foglalás összefoglaló",
    nameLabel: "Vezeték- és keresztnév:",
    dateLabel: "Dátum:",
    dropOffLabel: "Leadás:",
    estimatedPickUpLabel: "Becsült átvétel:",
    showerTimeLabel: "Zuhanyidő:",
    qtyLabel: "Mennyiség:",
    totalLabel: "Összesen:",
    showQrAtReception: "Mutasd meg ezt a QR-kódot a recepción a gyorsabb bejelentkezéshez.",
    qrAltPrefix: "QR-kód a foglaláshoz",
    itemFallback: "Tétel",

    checkoutEmpty: "A foglalásod üres.",
    cityLabel: "Város (honnan érkeztél)",
    cityPlaceholder: "Budapest, Berlin, Madrid...",
    createBooking: "Foglalás létrehozása",
    creatingBooking: "Foglalás létrehozása...",
    checkoutError: "Hiba történt a foglalás során.",
  },
};

export function getMessages(language?: string | null): Messages {
  const lang = normalizeLanguage(language);
  return messages[lang] ?? messages[DEFAULT_LANGUAGE];
}