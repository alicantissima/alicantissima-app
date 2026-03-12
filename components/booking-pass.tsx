


"use client";

import BookingQr from "@/components/booking-qr";

type Props = {
  code: string;
};

export default function BookingPass({ code }: Props) {
  return (
    <div className="flex justify-center">
      <BookingQr code={code} compact />
    </div>
  );
}