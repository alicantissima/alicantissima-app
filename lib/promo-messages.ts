import type { AppLanguage } from "@/lib/i18n";

const messages: Record<AppLanguage, [string, string, string, string, string]> = {
  en: ["Promo code (optional)", "Apply", "Discount", "Subtotal", "Please apply a valid promo code or clear the field."],
  es: ["Código promocional (opcional)", "Aplicar", "Descuento", "Subtotal", "Aplica un código válido o vacía el campo."],
  pt: ["Código promocional (opcional)", "Aplicar", "Desconto", "Subtotal", "Aplica um código válido ou limpa o campo."],
  fr: ["Code promotionnel (facultatif)", "Appliquer", "Réduction", "Sous-total", "Appliquez un code valide ou videz le champ."],
  it: ["Codice promozionale (facoltativo)", "Applica", "Sconto", "Subtotale", "Applica un codice valido o svuota il campo."],
  de: ["Aktionscode (optional)", "Anwenden", "Rabatt", "Zwischensumme", "Bitte einen gültigen Code anwenden oder das Feld leeren."],
  no: ["Kampanjekode (valgfritt)", "Bruk", "Rabatt", "Delsum", "Bruk en gyldig kode eller tøm feltet."],
  pl: ["Kod promocyjny (opcjonalnie)", "Zastosuj", "Rabat", "Suma częściowa", "Zastosuj prawidłowy kod lub wyczyść pole."],
  sv: ["Kampanjkod (valfritt)", "Använd", "Rabatt", "Delsumma", "Använd en giltig kod eller töm fältet."],
  fi: ["Alennuskoodi (valinnainen)", "Käytä", "Alennus", "Välisumma", "Käytä kelvollista koodia tai tyhjennä kenttä."],
  da: ["Rabatkode (valgfrit)", "Anvend", "Rabat", "Subtotal", "Anvend en gyldig kode eller ryd feltet."],
  hu: ["Promóciós kód (opcionális)", "Alkalmaz", "Kedvezmény", "Részösszeg", "Alkalmazz érvényes kódot, vagy töröld a mezőt."],
};

export function getPromoMessages(language: AppLanguage) {
  const [code, apply, discount, subtotal, invalid] = messages[language];
  return { code, apply, discount, subtotal, invalid };
}
