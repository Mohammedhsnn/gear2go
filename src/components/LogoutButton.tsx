"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          router.push("/dashboard");
          router.refresh();
          setLoading(false);
        }
      }}
    >
      {loading ? "UITLOGGEN..." : "LOG OUT"}
    </button>
  );
}
