import Link from "next/link";

type MobileTopBarProps = {
  title: string;
  backHref?: string;
  rightSlot?: React.ReactNode;
};

export function MobileTopBar({ title, backHref, rightSlot }: MobileTopBarProps) {
  return (
    <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-[60] flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-4">
        {backHref ? (
          <Link className="flex items-center" href={backHref}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
        ) : (
          <span className="material-symbols-outlined text-primary opacity-0">
            arrow_back
          </span>
        )}
        <span className="text-xl font-bold tracking-tighter text-primary uppercase font-headline">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-4">{rightSlot}</div>
    </header>
  );
}

