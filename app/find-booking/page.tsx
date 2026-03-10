

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BookingQr from "@/components/booking-qr";

type Booking = {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_email: string;
  status: string;
  created_at?: string;
};

export default function FindBookingPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function searchBooking() {
  setError("");
  setBookings([]);
  setLoading(true);

  try {
    console.log("SEARCH START");
    console.log("code:", code);
    console.log("email:", email);

    if (!code.trim() && !email.trim()) {
      setError("Please enter booking code or email");
      return;
    }

    if (code.trim()) {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_code, customer_name, customer_email, status, created_at")
        .eq("booking_code", code.trim().toUpperCase())
        .limit(1);

      console.log("CODE SEARCH DATA:", data);
      console.log("CODE SEARCH ERROR:", error);

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
      .select("id, booking_code, customer_name, customer_email, status, created_at")
      .ilike("customer_email", email.trim())
      .order("created_at", { ascending: false });

    console.log("EMAIL SEARCH DATA:", data);
    console.log("EMAIL SEARCH ERROR:", error);

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
        <p><strong>Booking:</strong> {booking.booking_code}</p>
        <p><strong>Name:</strong> {booking.customer_name}</p>
        <p><strong>Email:</strong> {booking.customer_email}</p>
        <p><strong>Status:</strong> {booking.status}</p>

        <div className="pt-3 flex justify-center">
          <BookingQr code={booking.booking_code} />
        </div>
      </div>
    ))}
  </div>
)}