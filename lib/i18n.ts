


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

  bookShowerTitle: string;
  bookShowerSubtitle: string;
  chooseShowerTime: string;
  numberOfShowers: string;

  bookShowerChooseDateAlert: string;
  bookShowerChooseTimeAlert: string;
  bookShowerProductName: string;

  bookComboTitle: string;
  bookComboSubtitle: string;
  chooseComboDate: string;
  chooseLuggageDropOffTime: string;
  chooseApproxShowerTime: string;
  comboShowerHelpText: string;

  comboMainLabel: string;
  comboMainPriceLabel: string;
  comboExtraLuggageLabel: string;
  comboExtraLuggagePriceLabel: string;
  comboExtraShowerLabel: string;
  comboExtraShowerPriceLabel: string;

  bookComboChooseDateAlert: string;
  bookComboChooseDropOffAlert: string;
  bookComboChooseShowerAlert: string;
  bookComboProductName: string;
  comboBreakdownMainLabel: string;
  comboBreakdownExtraLuggageLabel: string;
  comboBreakdownExtraShowerLabel: string;

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

commentsLabel: string;
checkInQrTitle: string;
installAppTitle: string;
installAppText: string;
openInApp: string;
};

const baseMessages: Messages = {
  bookingPassTitle: "Alicantissima Booking Pass",
  showAtReception: "Show this screen at reception for faster check-in.",
  checkInQr: "Check-in QR",
  paymentOnSite: "No online payment. Payment is made at reception, by card or cash.",
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


  bookShowerTitle: "Take a Shower",
  bookShowerSubtitle: "Refresh yourself before your trip or after the beach",
  chooseShowerTime: "Choose shower time",
  numberOfShowers: "Number of showers",

  bookShowerChooseDateAlert: "Please choose a date.",
  bookShowerChooseTimeAlert: "Please choose a shower time.",
  bookShowerProductName: "Shower",

bookComboTitle: "Luggage + Shower",
  bookComboSubtitle: "Leave your bags, enjoy the day and take a refreshing shower",
  chooseComboDate: "Choose the date",
  chooseLuggageDropOffTime: "Luggage drop-off time",
  chooseApproxShowerTime: "Shower time (approx.)",
  comboShowerHelpText: "You can take your shower and still come back later to collect your luggage.",

  comboMainLabel: "Luggage + Shower",
  comboMainPriceLabel: "€18 / person",
  comboExtraLuggageLabel: "Additional luggage",
  comboExtraLuggagePriceLabel: "€8 / item / all day",
  comboExtraShowerLabel: "Additional shower",
  comboExtraShowerPriceLabel: "€12 / person",

  bookComboChooseDateAlert: "Please choose a date.",
  bookComboChooseDropOffAlert: "Please choose a luggage drop-off time.",
  bookComboChooseShowerAlert: "Please choose a shower time.",
  bookComboProductName: "Luggage + Shower",
  comboBreakdownMainLabel: "Luggage + Shower",
  comboBreakdownExtraLuggageLabel: "Additional luggage",
  comboBreakdownExtraShowerLabel: "Additional shower",
  bookLuggageProductName: "Luggage Storage",

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
checkInQrTitle: "Check-in QR",
commentsLabel: "Comments",
installAppTitle: "Install the app",
installAppText: "Add the Alicantissima app to your phone for faster check-in and easy access to your booking.",
openInApp: "Open in app",
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

  totalLabel: "Total:",

  checkoutError: "Se produjo un error durante la reserva.",
    bookShowerTitle: "Tomar una ducha",
    bookShowerSubtitle: "Refréscate antes de tu viaje o después de la playa",
    chooseShowerTime: "Elegir hora de la ducha",
    numberOfShowers: "Número de duchas",

    bookShowerChooseDateAlert: "Por favor, elige una fecha.",
    bookShowerChooseTimeAlert: "Por favor, elige una hora de ducha.",
    bookShowerProductName: "Ducha",
    bookComboTitle: "Equipaje + Ducha",
    bookComboSubtitle: "Deja tus maletas, disfruta del día y date una ducha refrescante",
    chooseComboDate: "Elegir fecha",
    chooseLuggageDropOffTime: "Hora de entrega del equipaje",
    chooseApproxShowerTime: "Hora de la ducha (aprox.)",
    comboShowerHelpText: "Puedes ducharte y volver más tarde para recoger tu equipaje.",

    comboMainLabel: "Equipaje + Ducha",
    comboMainPriceLabel: "€18 / persona",
    comboExtraLuggageLabel: "Equipaje adicional",
    comboExtraLuggagePriceLabel: "€8 / artículo / todo el día",
    comboExtraShowerLabel: "Ducha adicional",
    comboExtraShowerPriceLabel: "€12 / persona",

    bookComboChooseDateAlert: "Por favor, elige una fecha.",
    bookComboChooseDropOffAlert: "Por favor, elige una hora de entrega del equipaje.",
    bookComboChooseShowerAlert: "Por favor, elige una hora de ducha.",
    bookComboProductName: "Equipaje + Ducha",
    comboBreakdownMainLabel: "Equipaje + Ducha",
    comboBreakdownExtraLuggageLabel: "Equipaje adicional",
    comboBreakdownExtraShowerLabel: "Ducha adicional",
thankYouBookingCodePrefix: "Gracias. Tu código de reserva es",
checkInQrTitle: "QR de check-in",
qtyLabel: "Cant.",
commentsLabel: "Comentarios",
installAppTitle: "Instala la app",
installAppText: "Añade la app de Alicantissima a tu móvil para un check-in más rápido y un acceso fácil a tu reserva.",
openInApp: "Abrir en la app",
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
    bookShowerTitle: "Tomar um duche",
    bookShowerSubtitle: "Refresca-te antes da viagem ou depois da praia",
    chooseShowerTime: "Escolher hora do duche",
    numberOfShowers: "Número de duches",

    bookShowerChooseDateAlert: "Por favor, escolhe uma data.",
    bookShowerChooseTimeAlert: "Por favor, escolhe uma hora de duche.",
    bookShowerProductName: "Duche",
    bookComboTitle: "Bagagem + Duche",
    bookComboSubtitle: "Deixa as malas, aproveita o dia e toma um duche refrescante",
    chooseComboDate: "Escolher data",
    chooseLuggageDropOffTime: "Hora de entrega da bagagem",
    chooseApproxShowerTime: "Hora do duche (aprox.)",
    comboShowerHelpText: "Podes tomar o teu duche e voltar mais tarde para recolher a bagagem.",

    comboMainLabel: "Bagagem + Duche",
    comboMainPriceLabel: "€18 / pessoa",
    comboExtraLuggageLabel: "Bagagem adicional",
    comboExtraLuggagePriceLabel: "€8 / item / todo o dia",
    comboExtraShowerLabel: "Duche adicional",
    comboExtraShowerPriceLabel: "€12 / pessoa",

    bookComboChooseDateAlert: "Por favor, escolhe uma data.",
    bookComboChooseDropOffAlert: "Por favor, escolhe uma hora de entrega da bagagem.",
    bookComboChooseShowerAlert: "Por favor, escolhe uma hora de duche.",
    bookComboProductName: "Bagagem + Duche",
    comboBreakdownMainLabel: "Bagagem + Duche",
    comboBreakdownExtraLuggageLabel: "Bagagem adicional",
    comboBreakdownExtraShowerLabel: "Duche adicional",
checkInQrTitle: "QR de check-in",
qtyLabel: "Qtd.",
commentsLabel: "Comentários",
installAppTitle: "Instala a app",
installAppText: "Adiciona a app da Alicantissima ao teu telemóvel para um check-in mais rápido e acesso fácil à tua reserva.",
openInApp: "Abrir na app",
  },

  fr: {
  ...baseMessages,

  back: "Retour",
  backToProductMenu: "Retour au menu des services",

  bookLuggageTitle: "Consigne à bagages",
  bookLuggageSubtitle: "Consigne à bagages rapide et sécurisée au centre d’Alicante",
  paymentOnSite: "Aucun paiement en ligne. Le paiement s’effectue à la réception, par carte ou en espèces.",

  chooseDate: "Choisir la date",
  chooseDropOffTime: "Choisir l’heure de dépôt",
  estimatedPickUpTime: "Heure estimée de récupération",

  numberOfLuggage: "Nombre de bagages",
  totalPrice: "Prix total",
  bookNow: "Réserver maintenant",
  commentsOptional: "Commentaires (facultatif)",

  nameLabel: "Nom :",
  cityLabel: "Ville d’origine",
  cityPlaceholder: "Paris, Berlin, Madrid...",

  email: "E-mail",
  phone: "Téléphone",

  createBooking: "Créer la réservation",
  creatingBooking: "Création de la réservation...",

  checkoutEmpty: "Votre réservation est vide.",
  bookingSummary: "Récapitulatif de la réservation",

  dateLabel: "Date :",
  dropOffLabel: "Dépôt :",
  estimatedPickUpLabel: "Récupération estimée :",
  showerTimeLabel: "Heure de douche :",

  totalLabel: "Total :",

  checkoutError: "Une erreur s’est produite lors de la réservation.",

  bookShowerTitle: "Prendre une douche",
  bookShowerSubtitle: "Rafraîchissez-vous avant votre voyage ou après la plage",
  chooseShowerTime: "Choisir l’heure de la douche",
  numberOfShowers: "Nombre de douches",

  bookShowerChooseDateAlert: "Veuillez choisir une date.",
  bookShowerChooseTimeAlert: "Veuillez choisir une heure de douche.",
  bookShowerProductName: "Douche",

  bookComboTitle: "Bagages + Douche",
  bookComboSubtitle: "Déposez vos bagages, profitez de la journée et prenez une douche rafraîchissante",
  chooseComboDate: "Choisir la date",
  chooseLuggageDropOffTime: "Heure de dépôt des bagages",
  chooseApproxShowerTime: "Heure de la douche (approx.)",
  comboShowerHelpText: "Vous pouvez prendre votre douche et revenir plus tard récupérer vos bagages.",

  comboMainLabel: "Bagages + Douche",
  comboMainPriceLabel: "18 € / personne",
  comboExtraLuggageLabel: "Bagage supplémentaire",
  comboExtraLuggagePriceLabel: "8 € / bagage / toute la journée",
  comboExtraShowerLabel: "Douche supplémentaire",
  comboExtraShowerPriceLabel: "12 € / personne",

  bookComboChooseDateAlert: "Veuillez choisir une date.",
  bookComboChooseDropOffAlert: "Veuillez choisir une heure de dépôt des bagages.",
  bookComboChooseShowerAlert: "Veuillez choisir une heure de douche.",
  bookComboProductName: "Bagages + Douche",
  comboBreakdownMainLabel: "Bagages + Douche",
  comboBreakdownExtraLuggageLabel: "Bagage supplémentaire",
  comboBreakdownExtraShowerLabel: "Douche supplémentaire",

  thankYouBookingCodePrefix: "Merci. Votre code de réservation est",
  checkInQrTitle: "QR de check-in",
  qtyLabel: "Qté :",
  commentsLabel: "Commentaires",
  installAppTitle: "Installez l’application",
  installAppText: "Ajoutez l’application Alicantissima à votre téléphone pour un check-in plus rapide et un accès facile à votre réservation.",
  openInApp: "Ouvrir dans l’application",
},

  it: {
  ...baseMessages,

  bookingPassTitle: "Pass prenotazione Alicantissima",
  showAtReception: "Mostra questa schermata alla reception per un check-in più rapido.",
  checkInQr: "QR per il check-in",
  paymentOnSite: "Il pagamento si effettua alla reception, con carta o in contanti.",
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
    bookShowerTitle: "Fare una doccia",
    bookShowerSubtitle: "Rinfrescati prima del viaggio o dopo la spiaggia",
    chooseShowerTime: "Scegli l'orario della doccia",
    numberOfShowers: "Numero di docce",

    bookShowerChooseDateAlert: "Per favore, scegli una data.",
    bookShowerChooseTimeAlert: "Per favore, scegli un orario per la doccia.",
    bookShowerProductName: "Doccia",
bookComboTitle: "Bagagli + Doccia",
bookComboSubtitle: "Lascia i bagagli, goditi la giornata e fai una doccia rinfrescante",
chooseComboDate: "Scegli la data",
chooseLuggageDropOffTime: "Orario di consegna dei bagagli",
chooseApproxShowerTime: "Orario doccia (circa)",
comboShowerHelpText:
  "Puoi fare la doccia e tornare più tardi a ritirare i bagagli.",

comboMainLabel: "Bagagli + Doccia",
comboMainPriceLabel: "18 € / persona",
comboExtraLuggageLabel: "Bagaglio aggiuntivo",
comboExtraLuggagePriceLabel: "8 € / pezzo / tutto il giorno",
comboExtraShowerLabel: "Doccia aggiuntiva",
comboExtraShowerPriceLabel: "12 € / persona",

bookComboChooseDateAlert: "Seleziona una data.",
bookComboChooseDropOffAlert: "Seleziona un orario per lasciare i bagagli.",
bookComboChooseShowerAlert: "Seleziona un orario per la doccia.",
bookComboProductName: "Bagagli + Doccia",

comboBreakdownMainLabel: "Bagagli + Doccia",
comboBreakdownExtraLuggageLabel: "Bagaglio aggiuntivo",
comboBreakdownExtraShowerLabel: "Doccia aggiuntiva",
checkInQrTitle: "QR per il check-in",
qtyLabel: "Qtà",
commentsLabel: "Commenti",
installAppTitle: "Installa l’app",
installAppText: "Aggiungi l’app Alicantissima al tuo telefono per un check-in più veloce e un accesso facile alla tua prenotazione.",
openInApp: "Apri nell’app",
},


  no: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima reservasjonskort",
    showAtReception: "Vis denne skjermen i resepsjonen for raskere innsjekking.",
    checkInQr: "QR-kode for innsjekking",
    paymentOnSite: "Betaling skjer i resepsjonen, med kort eller kontanter.",
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
    bookShowerTitle: "Ta en dusj",
    bookShowerSubtitle: "Frisk deg opp før reisen eller etter stranden",
    chooseShowerTime: "Velg dusjtid",
    numberOfShowers: "Antall dusjer",

    bookShowerChooseDateAlert: "Vennligst velg en dato.",
    bookShowerChooseTimeAlert: "Vennligst velg dusjtid.",
    bookShowerProductName: "Dusj",
bookComboTitle: "Bagasje + Dusj",
bookComboSubtitle: "La bagasjen stå, nyt dagen og ta en forfriskende dusj",
chooseComboDate: "Velg dato",
chooseLuggageDropOffTime: "Tid for levering av bagasje",
chooseApproxShowerTime: "Dusjtid (ca.)",
comboShowerHelpText:
  "Du kan ta en dusj og komme tilbake senere for å hente bagasjen.",

comboMainLabel: "Bagasje + Dusj",
comboMainPriceLabel: "18 € / person",
comboExtraLuggageLabel: "Ekstra bagasje",
comboExtraLuggagePriceLabel: "8 € / stk / hele dagen",
comboExtraShowerLabel: "Ekstra dusj",
comboExtraShowerPriceLabel: "12 € / person",

bookComboChooseDateAlert: "Velg en dato.",
bookComboChooseDropOffAlert: "Velg tidspunkt for levering av bagasje.",
bookComboChooseShowerAlert: "Velg tidspunkt for dusj.",
bookComboProductName: "Bagasje + Dusj",

comboBreakdownMainLabel: "Bagasje + Dusj",
comboBreakdownExtraLuggageLabel: "Ekstra bagasje",
comboBreakdownExtraShowerLabel: "Ekstra dusj",
checkInQrTitle: "QR for innsjekk",
qtyLabel: "Ant.",
commentsLabel: "Kommentarer",
installAppTitle: "Installer appen",
installAppText: "Legg til Alicantissima-appen på telefonen din for raskere innsjekk og enkel tilgang til bookingen din.",
openInApp: "Åpne i appen",
  },


  de: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima Buchungspass",
    showAtReception: "Zeige diesen Bildschirm an der Rezeption für einen schnelleren Check-in.",
    checkInQr: "Check-in QR-Code",
    paymentOnSite: "Die Zahlung erfolgt an der Rezeption, per Karte oder bar.",
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
    bookShowerTitle: "Dusche nehmen",
    bookShowerSubtitle: "Erfrische dich vor deiner Reise oder nach dem Strand",
    chooseShowerTime: "Duschzeit wählen",
    numberOfShowers: "Anzahl Duschen",

    bookShowerChooseDateAlert: "Bitte wähle ein Datum.",
    bookShowerChooseTimeAlert: "Bitte wähle eine Duschzeit.",
    bookShowerProductName: "Dusche",
bookComboTitle: "Gepäck + Dusche",
bookComboSubtitle: "Lass dein Gepäck hier, genieße den Tag und nimm eine erfrischende Dusche",
chooseComboDate: "Datum wählen",
chooseLuggageDropOffTime: "Uhrzeit für Gepäckabgabe",
chooseApproxShowerTime: "Duschzeit (ca.)",
comboShowerHelpText:
  "Du kannst duschen und später zurückkommen, um dein Gepäck abzuholen.",

comboMainLabel: "Gepäck + Dusche",
comboMainPriceLabel: "18 € / Person",
comboExtraLuggageLabel: "Zusätzliches Gepäck",
comboExtraLuggagePriceLabel: "8 € / Stück / ganzer Tag",
comboExtraShowerLabel: "Zusätzliche Dusche",
comboExtraShowerPriceLabel: "12 € / Person",

bookComboChooseDateAlert: "Bitte ein Datum wählen.",
bookComboChooseDropOffAlert: "Bitte eine Uhrzeit für die Gepäckabgabe wählen.",
bookComboChooseShowerAlert: "Bitte eine Duschzeit wählen.",
bookComboProductName: "Gepäck + Dusche",

comboBreakdownMainLabel: "Gepäck + Dusche",
comboBreakdownExtraLuggageLabel: "Zusätzliches Gepäck",
comboBreakdownExtraShowerLabel: "Zusätzliche Dusche",
checkInQrTitle: "Check-in-QR",
qtyLabel: "Menge",
commentsLabel: "Kommentare",
installAppTitle: "App installieren",
installAppText: "Füge die Alicantissima-App zu deinem Handy hinzu für einen schnelleren Check-in und einfachen Zugriff auf deine Buchung.",
openInApp: "In der App öffnen",
  },


  pl: {
  ...baseMessages,
  bookingPassTitle: "Karta rezerwacji Alicantissima",
  showAtReception: "Pokaż ten ekran w recepcji, aby przyspieszyć check-in.",
  checkInQr: "Kod QR do check-in",
  paymentOnSite: "Płatność odbywa się w recepcji, kartą lub gotówką.",
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
    bookShowerTitle: "Wziąć prysznic",
    bookShowerSubtitle: "Odśwież się przed podróżą lub po plaży",
    chooseShowerTime: "Wybierz godzinę prysznica",
    numberOfShowers: "Liczba pryszniców",

    bookShowerChooseDateAlert: "Proszę wybrać datę.",
    bookShowerChooseTimeAlert: "Proszę wybrać godzinę prysznica.",
    bookShowerProductName: "Prysznic",

  bookComboTitle: "Bagaż + Prysznic",
  bookComboSubtitle: "Zostaw bagaż, ciesz się dniem i weź odświeżający prysznic",
  chooseComboDate: "Wybierz datę",
  chooseLuggageDropOffTime: "Godzina pozostawienia bagażu",
  chooseApproxShowerTime: "Godzina prysznica (orientacyjnie)",
  comboShowerHelpText:
    "Możesz wziąć prysznic i wrócić później po swój bagaż.",

  comboMainLabel: "Bagaż + Prysznic",
  comboMainPriceLabel: "18 € / osoba",
  comboExtraLuggageLabel: "Dodatkowy bagaż",
  comboExtraLuggagePriceLabel: "8 € / sztuka / cały dzień",
  comboExtraShowerLabel: "Dodatkowy prysznic",
  comboExtraShowerPriceLabel: "12 € / osoba",

  bookComboChooseDateAlert: "Proszę wybrać datę.",
  bookComboChooseDropOffAlert: "Proszę wybrać godzinę pozostawienia bagażu.",
  bookComboChooseShowerAlert: "Proszę wybrać godzinę prysznica.",
  bookComboProductName: "Bagaż + Prysznic",
  comboBreakdownMainLabel: "Bagaż + Prysznic",
  comboBreakdownExtraLuggageLabel: "Dodatkowy bagaż",
  comboBreakdownExtraShowerLabel: "Dodatkowy prysznic",
checkInQrTitle: "Kod QR do check-inu",
qtyLabel: "Ilość",
commentsLabel: "Komentarze",
installAppTitle: "Zainstaluj aplikację",
installAppText: "Dodaj aplikację Alicantissima do telefonu, aby szybciej się zameldować i mieć łatwy dostęp do rezerwacji.",
openInApp: "Otwórz w aplikacji",
},


  sv: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima bokningspass",
    showAtReception: "Visa denna skärm i receptionen för snabbare incheckning.",
    checkInQr: "QR-kod för incheckning",
    paymentOnSite: "Betalning sker i receptionen, med kort eller kontanter.",
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
    bookShowerTitle: "Ta en dusch",
    bookShowerSubtitle: "Fräscha upp dig före resan eller efter stranden",
    chooseShowerTime: "Välj duschtid",
    numberOfShowers: "Antal duschar",

    bookShowerChooseDateAlert: "Välj ett datum.",
    bookShowerChooseTimeAlert: "Välj en duschtid.",
    bookShowerProductName: "Dusch",
bookComboTitle: "Bagage + Dusch",
bookComboSubtitle: "Lämna ditt bagage, njut av dagen och ta en uppfriskande dusch",
chooseComboDate: "Välj datum",
chooseLuggageDropOffTime: "Tid för att lämna bagage",
chooseApproxShowerTime: "Duschtid (ca.)",
comboShowerHelpText:
  "Du kan duscha och komma tillbaka senare för att hämta ditt bagage.",

comboMainLabel: "Bagage + Dusch",
comboMainPriceLabel: "18 € / person",
comboExtraLuggageLabel: "Extra bagage",
comboExtraLuggagePriceLabel: "8 € / styck / hela dagen",
comboExtraShowerLabel: "Extra dusch",
comboExtraShowerPriceLabel: "12 € / person",

bookComboChooseDateAlert: "Välj ett datum.",
bookComboChooseDropOffAlert: "Välj en tid för att lämna bagage.",
bookComboChooseShowerAlert: "Välj en duschtid.",
bookComboProductName: "Bagage + Dusch",

comboBreakdownMainLabel: "Bagage + Dusch",
comboBreakdownExtraLuggageLabel: "Extra bagage",
comboBreakdownExtraShowerLabel: "Extra dusch",
  },


  fi: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima-varauspassi",
    showAtReception: "Näytä tämä näyttö vastaanotossa nopeampaa sisäänkirjautumista varten.",
    checkInQr: "Sisäänkirjautumisen QR-koodi",
    paymentOnSite: "Maksu suoritetaan vastaanotossa kortilla tai käteisellä.",
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
    checkoutError: "Varauksen aikana tapahtui virhe.",    bookShowerTitle: "Käy suihkussa",
    bookShowerSubtitle: "Raikastu ennen matkaa tai rannan jälkeen",
    chooseShowerTime: "Valitse suihkuaika",
    numberOfShowers: "Suihkujen määrä",

    bookShowerChooseDateAlert: "Valitse päivämäärä.",
    bookShowerChooseTimeAlert: "Valitse suihkuaika.",
    bookShowerProductName: "Suihku",
bookComboTitle: "Matkatavarat + Suihku",
bookComboSubtitle: "Jätä matkatavarat, nauti päivästä ja käy virkistävässä suihkussa",
chooseComboDate: "Valitse päivämäärä",
chooseLuggageDropOffTime: "Matkatavaroiden jättöaika",
chooseApproxShowerTime: "Suihkun aika (noin)",
comboShowerHelpText:
  "Voit käydä suihkussa ja palata myöhemmin hakemaan matkatavarasi.",

comboMainLabel: "Matkatavarat + Suihku",
comboMainPriceLabel: "18 € / henkilö",
comboExtraLuggageLabel: "Lisämatkatavara",
comboExtraLuggagePriceLabel: "8 € / kpl / koko päivä",
comboExtraShowerLabel: "Lisäsuihku",
comboExtraShowerPriceLabel: "12 € / henkilö",

bookComboChooseDateAlert: "Valitse päivämäärä.",
bookComboChooseDropOffAlert: "Valitse matkatavaroiden jättöaika.",
bookComboChooseShowerAlert: "Valitse suihkun aika.",
bookComboProductName: "Matkatavarat + Suihku",

comboBreakdownMainLabel: "Matkatavarat + Suihku",
comboBreakdownExtraLuggageLabel: "Lisämatkatavara",
comboBreakdownExtraShowerLabel: "Lisäsuihku",
  },


  da: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima bookingpas",
    showAtReception: "Vis denne skærm i receptionen for hurtigere check-in.",
    checkInQr: "QR-kode til check-in",
    paymentOnSite: "Betaling sker i receptionen, med kort eller kontant.",
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
    bookShowerTitle: "Tag et bad",
    bookShowerSubtitle: "Frisk dig op før din rejse eller efter stranden",
    chooseShowerTime: "Vælg badetid",
    numberOfShowers: "Antal bade",

    bookShowerChooseDateAlert: "Vælg venligst en dato.",
    bookShowerChooseTimeAlert: "Vælg venligst et badetidspunkt.",
    bookShowerProductName: "Bad",
bookComboTitle: "Bagage + Bruser",
bookComboSubtitle: "Efterlad dine tasker, nyd dagen og tag et forfriskende bad",
chooseComboDate: "Vælg dato",
chooseLuggageDropOffTime: "Tid for aflevering af bagage",
chooseApproxShowerTime: "Brusetid (ca.)",
comboShowerHelpText:
  "Du kan tage et bad og komme tilbage senere for at hente din bagage.",

comboMainLabel: "Bagage + Bruser",
comboMainPriceLabel: "18 € / person",
comboExtraLuggageLabel: "Ekstra bagage",
comboExtraLuggagePriceLabel: "8 € / stk / hele dagen",
comboExtraShowerLabel: "Ekstra bruser",
comboExtraShowerPriceLabel: "12 € / person",

bookComboChooseDateAlert: "Vælg en dato.",
bookComboChooseDropOffAlert: "Vælg tidspunkt for aflevering af bagage.",
bookComboChooseShowerAlert: "Vælg tidspunkt for bruser.",
bookComboProductName: "Bagage + Bruser",

comboBreakdownMainLabel: "Bagage + Bruser",
comboBreakdownExtraLuggageLabel: "Ekstra bagage",
comboBreakdownExtraShowerLabel: "Ekstra bruser",
  },

  hu: {
    ...baseMessages,
    bookingPassTitle: "Alicantissima foglalási belépő",
    showAtReception: "Mutasd meg ezt a képernyőt a recepción a gyorsabb bejelentkezéshez.",
    checkInQr: "Check-in QR-kód",
    paymentOnSite: "A fizetés a recepción történik, kártyával vagy készpénzzel.",
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
    bookShowerTitle: "Zuhanyozni",
    bookShowerSubtitle: "Frissülj fel utazás előtt vagy a strand után",
    chooseShowerTime: "Válassz zuhanyidőt",
    numberOfShowers: "Zuhanyok száma",

    bookShowerChooseDateAlert: "Kérlek, válassz dátumot.",
    bookShowerChooseTimeAlert: "Kérlek, válassz zuhanyidőt.",
    bookShowerProductName: "Zuhany",
bookComboTitle: "Csomag + Zuhany",
bookComboSubtitle: "Hagyd itt a csomagodat, élvezd a napot és vegyél egy frissítő zuhanyt",
chooseComboDate: "Válassz dátumot",
chooseLuggageDropOffTime: "Csomagleadás ideje",
chooseApproxShowerTime: "Zuhany időpont (kb.)",
comboShowerHelpText:
  "Lezuhanyozhatsz, majd később visszatérhetsz a csomagodért.",

comboMainLabel: "Csomag + Zuhany",
comboMainPriceLabel: "18 € / fő",
comboExtraLuggageLabel: "Extra csomag",
comboExtraLuggagePriceLabel: "8 € / darab / egész nap",
comboExtraShowerLabel: "Extra zuhany",
comboExtraShowerPriceLabel: "12 € / fő",

bookComboChooseDateAlert: "Kérjük válasszon dátumot.",
bookComboChooseDropOffAlert: "Kérjük válassza ki a csomagleadás idejét.",
bookComboChooseShowerAlert: "Kérjük válassza ki a zuhany idejét.",
bookComboProductName: "Csomag + Zuhany",

comboBreakdownMainLabel: "Csomag + Zuhany",
comboBreakdownExtraLuggageLabel: "Extra csomag",
comboBreakdownExtraShowerLabel: "Extra zuhany",
  },
};

export function getMessages(language?: string | null): Messages {
  const lang = normalizeLanguage(language);
  return messages[lang] ?? messages[DEFAULT_LANGUAGE];
}