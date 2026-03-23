"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { calculateAddOnsCents, type AddOnId, rentalAddOns } from "@/data/addOns";
import { clampToPositiveInt, daysBetweenInclusive, getProductById } from "@/data/catalog";

export type CartLine = {
  productId: string;
  quantity: number;
  startDateISO: string; // yyyy-mm-dd
  endDateISO: string; // yyyy-mm-dd
};

export type CartState = {
  lines: CartLine[];
  addOns: AddOnId[];
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
    const knownIds = new Set(rentalAddOns.map((x) => x.id));
    const parsedAddOns = Array.isArray((parsed as { addOns?: unknown[] }).addOns)
      ? ((parsed as { addOns?: unknown[] }).addOns as unknown[])
          .filter((x): x is AddOnId => typeof x === "string" && knownIds.has(x as AddOnId))
      : [];
    return {
      lines: parsed.lines,
      addOns: Array.from(new Set(parsedAddOns)),
    };
  } catch {
    return null;
  }
}

function initialState(): CartState {
  return { lines: [], addOns: [] };
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
  addOnsCents: number;
  totalCents: number;
};

type CartContextValue = {
  state: CartState;
  totals: CartTotals;
  addOrUpdateLine: (line: CartLine) => void;
  removeLine: (productId: string) => void;
  clear: () => void;
  setDatesForAll: (startDateISO: string, endDateISO: string) => void;
  toggleAddOn: (id: AddOnId) => void;
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

    const rentalDays =
      state.lines.length > 0
        ? daysBetweenInclusive(state.lines[0]!.startDateISO, state.lines[0]!.endDateISO)
        : 1;
    const addOnsCents = calculateAddOnsCents(state.addOns, rentalDays);
    const totalCents = subtotalCents + depositCents + shippingCents + addOnsCents;

    return { rentalDays, subtotalCents, depositCents, shippingCents, addOnsCents, totalCents };
  }, [state.addOns, state.lines]);

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
      if (existingIdx === -1) return { ...prev, lines: [...prev.lines, nextLine] };

      const next = [...prev.lines];
      next[existingIdx] = nextLine;
      return { ...prev, lines: next };
    });
  };

  const removeLine = (productId: string) => {
    setState((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.productId !== productId),
    }));
  };

  const clear = () => setState({ lines: [], addOns: [] });

  const setDatesForAll = (startDateISO: string, endDateISO: string) => {
    setState((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => ({ ...l, startDateISO, endDateISO })),
    }));
  };

  const toggleAddOn = (id: AddOnId) => {
    setState((prev) => ({
      ...prev,
      addOns: prev.addOns.includes(id)
        ? prev.addOns.filter((x) => x !== id)
        : [...prev.addOns, id],
    }));
  };

  const value: CartContextValue = {
    state,
    totals,
    addOrUpdateLine,
    removeLine,
    clear,
    setDatesForAll,
    toggleAddOn,
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

