


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
};

const messages: Record<AppLanguage, Messages> = {
  en: baseMessages,

  es: {
    ...baseMessages,
    back: "Volver",
    bookLuggageTitle: "Guardar equipaje",
    bookLuggageSubtitle: "Consigna segura y rápida en el centro de Alicante",
    chooseDate: "Elegir fecha",
    chooseDropOffTime: "Hora de entrega",
    estimatedPickUpTime: "Hora estimada de recogida",
    numberOfLuggage: "Número de maletas",
    totalPrice: "Precio total",
    bookNow: "Reservar",
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

  fr: { ...baseMessages },
  it: { ...baseMessages },
  no: { ...baseMessages },
  de: { ...baseMessages },
  pl: { ...baseMessages },
  sv: { ...baseMessages },
  fi: { ...baseMessages },
  da: { ...baseMessages },
  hu: { ...baseMessages },
};

export function getMessages(language?: string | null): Messages {
  const lang = normalizeLanguage(language);
  return messages[lang] ?? messages[DEFAULT_LANGUAGE];
}