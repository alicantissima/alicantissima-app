


"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import BookingQr from "@/components/booking-qr";


type BookingItem = {
  title: string;
  quantity: number;
  line_total: number;
};

type Booking = {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_email: string;
  status: string;
  created_at?: string;
  total_amount?: number;
  currency?: string;
  service_date?: string;
  check_in_time?: string;
  check_out_time?: string;
  booking_items?: BookingItem[];
};

function formatDateTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function FindBookingPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();

  const supabase = createClient();

useEffect(() => {
  const urlCode = params.get("code");
  const safeCode = urlCode?.trim().toUpperCase();

  if (!safeCode) return;

  setCode(safeCode);

  async function runSearch() {
    setError("");
    setBookings([]);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_code,
          customer_name,
          customer_email,
          status,
          created_at,
          total_amount,
          currency,
          service_date,
          check_in_time,
          check_out_time,
          booking_items (
            title,
            quantity,
            line_total
          )
        `)
        .eq("booking_code", safeCode)
        .limit(1);

      if (error) {
        setError(`Error: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        setError("Booking not found");
        return;
      }

      setBookings(data);
    } finally {
      setLoading(false);
    }
  }

  runSearch();
}, [params, supabase]);

  async function searchBooking() {
    setError("");
    setBookings([]);
    setLoading(true);

    try {
      if (!code.trim() && !email.trim()) {
        setError("Please enter booking code or email");
        return;
      }

      if (code.trim()) {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            "id, booking_code, customer_name, customer_email, status, created_at"
          )
          .eq("booking_code", code.trim().toUpperCase())
          .limit(1);

        if (error) {
          setError(`Error: ${error.message}`);
          return;
        }

        if (!data || data.length === 0) {
          setError("Booking not found");
          return;
        }

        setBookings(data);
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, booking_code, customer_name, customer_email, status, created_at"
        )
        .ilike("customer_email", email.trim())
        .order("created_at", { ascending: false });

      if (error) {
        setError(`Error: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        setError("Booking not found");
        return;
      }

      setBookings(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Find your booking</h1>

      <input
        type="text"
        placeholder="Booking code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full border rounded-xl p-3"
      />

      <div className="text-center text-sm text-gray-400">or</div>

      <input
        type="email"
        placeholder="Email used in reservation"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded-xl p-3"
      />

      <button
        onClick={searchBooking}
        disabled={loading}
        className="w-full bg-black text-white rounded-xl p-3 disabled:opacity-50"
      >
        {loading ? "Searching..." : "Search booking"}
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="border rounded-xl p-4 space-y-2">
              <p>
                <strong>Booking:</strong> {booking.booking_code}
              </p>
              <p>
                <strong>Name:</strong> {booking.customer_name}
              </p>
              <p>
                <strong>Email:</strong> {booking.customer_email}
              </p>
              <p>
  <strong>Status:</strong> {booking.status}
</p>

{booking.booking_items && booking.booking_items.length > 0 && (
  <div className="pt-3">
    <strong>Products</strong>
    <ul className="mt-2 space-y-1">
      {booking.booking_items.map((item, i) => (
        <li key={i}>
          {item.quantity} × {item.title}
        </li>
      ))}
    </ul>
  </div>
)}

{booking.total_amount && (
  <p className="pt-2">
    <strong>Total:</strong> {booking.total_amount} €
  </p>
)}

{booking.service_date && (
  <p className="pt-2">
    <strong>Service date:</strong> {formatDate(booking.service_date)}
  </p>
)}

{booking.check_in_time && (
  <p>
    <strong>Check-in:</strong> {formatDateTime(booking.check_in_time)}
  </p>
)}

{booking.check_out_time && (
  <p>
    <strong>Check-out:</strong> {formatDateTime(booking.check_out_time)}
  </p>
)}

<div className="pt-3 flex justify-center">
  <BookingQr code={booking.booking_code} />
</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


