


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
    back: "Voltar",
    bookLuggageTitle: "Guardar bagagem",
    bookLuggageSubtitle: "Guarda de bagagem rápida e segura no centro de Alicante",
    chooseDate: "Escolher data",
    chooseDropOffTime: "Hora de entrega",
    estimatedPickUpTime: "Hora estimada de recolha",
    numberOfLuggage: "Número de malas",
    totalPrice: "Preço total",
    bookNow: "Reservar",
  },

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
  no: { ...baseMessages },
  de: { ...baseMessages },
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
  sv: { ...baseMessages },
  fi: { ...baseMessages },
  da: { ...baseMessages },
  hu: { ...baseMessages },
};

export function getMessages(language?: string | null): Messages {
  const lang = normalizeLanguage(language);
  return messages[lang] ?? messages[DEFAULT_LANGUAGE];
}