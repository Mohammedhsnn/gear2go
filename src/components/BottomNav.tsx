import Link from "next/link";

type BottomNavProps = {
  active: "explore" | "rentals" | "inbox" | "profile";
};

export function BottomNav({ active }: BottomNavProps) {
  const base =
    "flex flex-col items-center justify-center px-2 py-1 hover:bg-surface-container-highest flex-1";
  const activeCls = "bg-primary text-on-primary";
  const inactiveCls = "text-on-surface-variant";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest flex justify-around items-center w-full h-20 border-t border-outline-variant/15 md:hidden">
      <div className="flex w-full h-full">
        <Link
          href="/search"
          className={`${base} ${active === "explore" ? activeCls : inactiveCls}`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            search
          </span>
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.05em]">
            EXPLORE
          </span>
        </Link>
        <Link
          href="/cart"
          className={`${base} ${active === "rentals" ? activeCls : inactiveCls}`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            shopping_bag
          </span>
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.05em]">
            RENTALS
          </span>
        </Link>
        <Link
          href="/search"
          className={`${base} ${active === "inbox" ? activeCls : inactiveCls}`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            chat_bubble
          </span>
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.05em]">
            INBOX
          </span>
        </Link>
        <Link
          href="/"
          className={`${base} ${active === "profile" ? activeCls : inactiveCls}`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            person
          </span>
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.05em]">
            PROFILE
          </span>
        </Link>
      </div>
    </nav>
  );
}

