type BotanicalProps = {
  className?: string;
};

/**
 * Soft watercolor flower.
 * Visibility is controlled by the wrapper `opacity-*` class only —
 * path fills stay relatively solid so we don't stack two fade layers.
 */
export function BotanicalFlower({ className = "" }: BotanicalProps) {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse
        cx="100"
        cy="100"
        rx="28"
        ry="42"
        fill="#8A9A7C"
        opacity="0.85"
        transform="rotate(-20 100 100)"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="28"
        ry="42"
        fill="#5F6F45"
        opacity="0.75"
        transform="rotate(40 100 100)"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="28"
        ry="42"
        fill="#8A9A7C"
        opacity="0.8"
        transform="rotate(100 100 100)"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="26"
        ry="38"
        fill="#6B5344"
        opacity="0.65"
        transform="rotate(160 100 100)"
      />
      <circle cx="100" cy="100" r="14" fill="#EDE8DF" opacity="0.9" />
      <circle cx="100" cy="100" r="7" fill="#6B5344" opacity="0.8" />
      <path
        d="M100 142 C95 160 88 175 82 188"
        stroke="#5F6F45"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <ellipse
        cx="78"
        cy="165"
        rx="14"
        ry="7"
        fill="#8A9A7C"
        opacity="0.8"
        transform="rotate(-35 78 165)"
      />
    </svg>
  );
}

/** Delicate botanical branch — same single-layer opacity model as the flower */
export function BotanicalBranch({ className = "" }: BotanicalProps) {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 140 C60 120 90 90 130 70 C160 55 190 40 220 28"
        stroke="#5F6F45"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <ellipse
        cx="70"
        cy="100"
        rx="18"
        ry="9"
        fill="#8A9A7C"
        opacity="0.85"
        transform="rotate(-40 70 100)"
      />
      <ellipse
        cx="110"
        cy="78"
        rx="16"
        ry="8"
        fill="#5F6F45"
        opacity="0.8"
        transform="rotate(-25 110 78)"
      />
      <ellipse
        cx="150"
        cy="58"
        rx="15"
        ry="7"
        fill="#8A9A7C"
        opacity="0.85"
        transform="rotate(-15 150 58)"
      />
      <ellipse
        cx="185"
        cy="42"
        rx="12"
        ry="6"
        fill="#6B5344"
        opacity="0.7"
        transform="rotate(-10 185 42)"
      />
      <ellipse
        cx="95"
        cy="115"
        rx="14"
        ry="7"
        fill="#8A9A7C"
        opacity="0.75"
        transform="rotate(20 95 115)"
      />
    </svg>
  );
}

/** Tiny leaf pair — section divider */
export function BotanicalLeafDivider({ className = "" }: BotanicalProps) {
  return (
    <div
      className={`flex items-center justify-center gap-3 ${className}`}
      aria-hidden="true"
    >
      <span className="h-px w-12 bg-border-soft sm:w-20" />
      <svg
        className="h-5 w-10 opacity-40"
        viewBox="0 0 48 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="14"
          cy="12"
          rx="10"
          ry="5"
          fill="#5F6F45"
          transform="rotate(-25 14 12)"
        />
        <ellipse
          cx="34"
          cy="12"
          rx="10"
          ry="5"
          fill="#8A9A7C"
          transform="rotate(25 34 12)"
        />
        <circle cx="24" cy="12" r="2" fill="#6B5344" />
      </svg>
      <span className="h-px w-12 bg-border-soft sm:w-20" />
    </div>
  );
}

/** Page-level decorations for home & article (~30% wrapper opacity) */
export function BotanicalPageDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <BotanicalFlower className="absolute -top-2 -right-2 h-44 w-44 opacity-30 sm:top-2 sm:right-4 sm:h-56 sm:w-56 sm:opacity-35" />
      <BotanicalBranch className="absolute bottom-0 left-0 h-36 w-52 opacity-30 sm:h-48 sm:w-72 sm:opacity-35" />
      <BotanicalFlower className="absolute bottom-[12%] right-[4%] h-28 w-28 rotate-[18deg] opacity-25 sm:h-40 sm:w-40 sm:opacity-30" />
      <BotanicalBranch className="absolute top-[28%] -left-6 h-24 w-36 rotate-[-12deg] opacity-20 sm:left-0 sm:h-32 sm:w-48 sm:opacity-25" />
      <BotanicalFlower className="absolute top-[55%] left-[8%] hidden h-24 w-24 rotate-[-30deg] opacity-20 lg:block" />
    </div>
  );
}

/** Login accents — fewer, softer, evenly placed around the form */
export function BotanicalLoginDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <BotanicalFlower className="absolute top-6 right-[8%] h-44 w-44 opacity-25 sm:h-56 sm:w-56 sm:opacity-30" />
      <BotanicalBranch className="absolute bottom-6 left-[6%] h-36 w-52 opacity-25 sm:h-44 sm:w-64 sm:opacity-30" />
      <BotanicalFlower className="absolute bottom-[20%] right-[10%] h-28 w-28 rotate-[15deg] opacity-20 sm:h-36 sm:w-36 sm:opacity-25" />
      <BotanicalBranch className="absolute top-[18%] left-[8%] h-28 w-44 rotate-[-8deg] opacity-20 sm:h-36 sm:w-56 sm:opacity-25" />
    </div>
  );
}
