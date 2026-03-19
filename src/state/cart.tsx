"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clampToPositiveInt, daysBetweenInclusive, getProductById } from "@/data/catalog";

export type CartLine = {
  productId: string;
  quantity: number;
  startDateISO: string; // yyyy-mm-dd
  endDateISO: string; // yyyy-mm-dd
};

export type CartState = {
  lines: CartLine[];
};

const DEFAULT_START = "2026-05-12";
const DEFAULT_END = "2026-05-15";
const STORAGE_KEY = "gear2go_cart_v1";

function safeParse(json: string | null): CartState | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as CartState;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function initialState(): CartState {
  return { lines: [] };
}

function loadInitialState(): CartState {
  if (typeof window === "undefined") return initialState();
  const fromStorage = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return fromStorage ?? initialState();
}

type CartTotals = {
  rentalDays: number; // computed from first line (for UI copy); per-line still supported
  subtotalCents: number;
  depositCents: number;
  shippingCents: number;
  totalCents: number;
};

type CartContextValue = {
  state: CartState;
  totals: CartTotals;
  addOrUpdateLine: (line: CartLine) => void;
  removeLine: (productId: string) => void;
  clear: () => void;
  setDatesForAll: (startDateISO: string, endDateISO: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(loadInitialState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const totals = useMemo<CartTotals>(() => {
    const shippingCents = state.lines.length > 0 ? 1250 : 0;
    let subtotalCents = 0;
    let depositCents = 0;

    for (const line of state.lines) {
      const product = getProductById(line.productId);
      if (!product) continue;
      const qty = clampToPositiveInt(line.quantity);
      const days = daysBetweenInclusive(line.startDateISO, line.endDateISO);
      subtotalCents += product.pricePerDayCents * qty * days;
      depositCents += product.depositCents * qty;
    }

    const totalCents = subtotalCents + depositCents + shippingCents;
    const rentalDays =
      state.lines.length > 0
        ? daysBetweenInclusive(state.lines[0]!.startDateISO, state.lines[0]!.endDateISO)
        : 1;

    return { rentalDays, subtotalCents, depositCents, shippingCents, totalCents };
  }, [state.lines]);

  const addOrUpdateLine = (line: CartLine) => {
    setState((prev) => {
      const qty = clampToPositiveInt(line.quantity);
      const nextLine: CartLine = {
        productId: line.productId,
        quantity: qty,
        startDateISO: line.startDateISO || DEFAULT_START,
        endDateISO: line.endDateISO || DEFAULT_END,
      };

      const existingIdx = prev.lines.findIndex((l) => l.productId === line.productId);
      if (existingIdx === -1) return { lines: [...prev.lines, nextLine] };

      const next = [...prev.lines];
      next[existingIdx] = nextLine;
      return { lines: next };
    });
  };

  const removeLine = (productId: string) => {
    setState((prev) => ({ lines: prev.lines.filter((l) => l.productId !== productId) }));
  };

  const clear = () => setState({ lines: [] });

  const setDatesForAll = (startDateISO: string, endDateISO: string) => {
    setState((prev) => ({
      lines: prev.lines.map((l) => ({ ...l, startDateISO, endDateISO })),
    }));
  };

  const value: CartContextValue = {
    state,
    totals,
    addOrUpdateLine,
    removeLine,
    clear,
    setDatesForAll,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function createDefaultLine(productId: string): CartLine {
  return {
    productId,
    quantity: 1,
    startDateISO: DEFAULT_START,
    endDateISO: DEFAULT_END,
  };
}

