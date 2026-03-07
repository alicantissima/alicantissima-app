

import { create } from "zustand";

export type BookingBreakdownItem = {
  label: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type BookingItem = {
  productCode: "luggage" | "shower" | "combo";
  productName: string;
  quantity: number;
  date: string;
  dropOffTime?: string;
  pickUpTime?: string;
  showerTime?: string;
  comments?: string;
  unitPrice: number;
  totalPrice: number;
  breakdown?: BookingBreakdownItem[];
};

type BookingStore = {
  items: BookingItem[];
  addItem: (item: BookingItem) => void;
  clearItems: () => void;
};

export const useBookingStore = create<BookingStore>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),
  clearItems: () => set({ items: [] }),
}));