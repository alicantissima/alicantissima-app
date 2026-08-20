


export type AlegraId = string | number;

export type AlegraContactType = "client" | "provider";

export type AlegraContact = {
  id: AlegraId;
  name: string;

  identification?: string | null;

  identificationObject?: {
    type?: string;
    number?: string;
  } | null;

  email?: string | null;
  phonePrimary?: string | null;
  phoneSecondary?: string | null;
  mobile?: string | null;

  status?: "active" | "inactive";
  type?: AlegraContactType[];
};

export type AlegraContactsListResponse = {
  metadata?: {
    total?: number | string;
  };
  data?: AlegraContact[];
  results?: AlegraContact[];
};

export type CreateAlegraContactInput = {
  name: string;

  identification: string;
  identificationType: "DPO" | "NIF" | "NIF-IVA";

  email?: string;
  phonePrimary?: string;
  mobile?: string;

  type: AlegraContactType[];
  status: "active";
};

export type AlegraTaxReference = {
  id: AlegraId;
};

export type AlegraInvoiceItemInput = {
  id: AlegraId;

  /**
   * Quantidade vendida.
   */
  quantity: number;

  /**
   * Preço unitário SEM IVA.
   *
   * A booking guarda atualmente o preço final com IVA.
   * Antes de enviar para a Alegra, convertemos:
   *
   * preço sem IVA = preço final / 1.21
   */
  price: number;

  /**
   * Impostos aplicados à linha.
   */
  tax: AlegraTaxReference[];

  /**
   * Referência visível do produto.
   */
  reference?: string;

  /**
   * Descrição apresentada na fatura.
   */
  description?: string;
};

export type AlegraPaymentInput = {
  date: string;

  account: {
    id: AlegraId;
  };

  amount: number;

  paymentMethod:
    | "transfer"
    | "cash"
    | "deposit"
    | "check"
    | "credit-card"
    | "debit-card";

  anotations?: string;
  observations?: string;
};

export type CreateAlegraInvoiceInput = {
  date: string;
  dueDate: string;
  paymentMethod?: "cash" | "credit-card";

  client: {
    id: AlegraId;
  };

  numberTemplate: {
    id: AlegraId;
  };

  items: AlegraInvoiceItemInput[];

  payments?: AlegraPaymentInput[];

  /**
   * Texto visível no PDF.
   */
  anotation?: string;

  /**
   * Informação interna, não visível no PDF.
   */
  observations?: string;

  termsConditions?: string;
};

export type AlegraInvoiceNumberTemplate = {
  id?: AlegraId;
  name?: string;
  prefix?: string;
  number?: number | string;
  fullNumber?: string;
};

export type AlegraInvoice = {
  id: AlegraId;

  number?: number | string;
  fullNumber?: string;

  status?: string;
  date?: string;
  dueDate?: string;

  total?: number | string;
  subtotal?: number | string;
  totalPaid?: number | string;
  balance?: number | string;

  client?: AlegraContact;

  numberTemplate?: AlegraInvoiceNumberTemplate;

  pdf?: string | null;
  pdfUrl?: string | null;
};

export type AlegraInvoiceWithPdf = AlegraInvoice & {
  pdf?: string | null;
  pdfUrl?: string | null;
};

export type BookingForAlegraInvoice = {
  id: string;
  booking_code: string;
payment_method: string | null;

  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;

  total_amount: string | number;
  currency: string | null;
  service_date: string | null;
  source: string | null;

  payment_status: string | null;
  payment_reference: string | null;

  paid_at?: string | null;

  invoice_provider: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  invoice_pdf_url: string | null;
  invoice_status: string | null;
  invoice_issued_at: string | null;
  invoice_error: string | null;
  alegra_contact_id: string | null;
};

export type BookingItemForAlegraInvoice = {
  id: string;
  booking_id: string;

  product_type: string | null;
  title: string | null;

  quantity: string | number;
  unit_price: string | number;
  line_total: string | number;

  meta: Record<string, unknown> | null;
};

export type AlegraProductConfig = {
  itemId: AlegraId;
  reference: "LUGG" | "SHW" | "LUGG+SHW";
  description: string;
};

export type AlegraInvoiceIssueResult = {
  ok: true;
  alreadyIssued: boolean;

  bookingId: string;
  bookingCode: string;

  contactId: string;
  invoiceId: string;
  invoiceNumber: string | null;
  invoicePdfUrl: string | null;
};