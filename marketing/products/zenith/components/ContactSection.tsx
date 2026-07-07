"use client";

import Footer from "./Footer";

const PILLARS = [
  {
    name: "Zénith Studio",
    tagline: "Donner forme à l'exigence",
    desc: "Architecture et conception haut de gamme, de l'esquisse au détail.",
  },
  {
    name: "Zénith Coordination",
    tagline: "Maîtriser chaque étape",
    desc: "Chiffrage, planification et gestion de projet, coûts maîtrisés dès la conception.",
  },
  {
    name: "Zénith Aménagement",
    tagline: "Livrer l'excellence",
    desc: "Aménagements intérieurs clé en main, exécution rigoureuse sur le terrain.",
  },
];

interface ContactSectionProps {
  onBookCall: () => void;
}

export default function ContactSection({ onBookCall }: ContactSectionProps) {
  return (
    <section
      id="book"
      className="relative z-10 flex min-h-[962px] w-full flex-col bg-[#1E1E1E] text-white"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-[var(--layout-gutter)] py-20 md:py-28">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {PILLARS.map((p) => (
            <div key={p.name} className="flex flex-col gap-3">
              <span className="text-[11px] font-normal uppercase tracking-[0.28em] text-white/45">
                {p.tagline}
              </span>
              <h3 className="text-[22px] font-medium leading-tight md:text-[24px]">
                {p.name}
              </h3>
              <p className="text-[15px] font-normal leading-relaxed text-white/70">
                {p.desc}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mt-20 max-w-[18ch] text-center text-[32px] font-medium leading-[1.05] tracking-[-0.01em] md:mt-28 md:text-[48px]">
          Une vision. Une maîtrise. Un résultat.
        </h2>
        <p className="mt-5 max-w-[42ch] text-center text-[15px] font-normal leading-relaxed text-white/70 md:text-[16px]">
          Un seul interlocuteur, de la conception à la livraison. Parlons de
          votre projet.
        </p>

        <button
          type="button"
          onClick={onBookCall}
          className="mt-10 flex h-[59px] w-[220px] shrink-0 items-center justify-center rounded-full bg-white text-[17px] font-medium text-black transition-opacity hover:opacity-90 md:mt-12"
          data-no-draw
        >
          Prendre rendez-vous
        </button>
      </div>

      <Footer />
    </section>
  );
}
