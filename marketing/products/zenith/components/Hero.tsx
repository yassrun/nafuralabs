export default function Hero() {
  return (
    <section className="sticky top-0 z-0 min-h-screen w-full bg-transparent">
      <div className="relative min-h-screen w-full">
        {/* Typographic headline — Zénith signature */}
        <div className="pointer-events-none absolute inset-0 bottom-[clamp(88px,14vh,140px)] flex flex-col items-center justify-center px-[var(--layout-gutter)]">
          <p
            className="pointer-events-auto mb-6 text-[11px] font-normal uppercase tracking-[0.35em] text-black/50 sm:text-[12px]"
            data-no-draw
          >
            Architecture · Ingénierie · Aménagement
          </p>
          <h1
            className="pointer-events-auto m-0 max-w-[16ch] text-center font-medium leading-[0.98] tracking-[-0.02em] text-black"
            style={{ fontSize: "clamp(2.75rem, 8vw, 7rem)" }}
            data-no-draw
          >
            Une vision.
            <br />
            Une maîtrise.
            <br />
            Un résultat.
          </h1>
        </div>

        <div className="pointer-events-none absolute right-[var(--layout-gutter)] bottom-[clamp(28px,4.5vh,56px)] left-[var(--layout-gutter)] flex flex-col items-stretch justify-between gap-8 md:flex-row md:items-end md:gap-4">
          <p
            className="pointer-events-auto m-0 shrink-0 p-0 text-left text-[11px] leading-none font-normal tracking-[0.06em] whitespace-nowrap text-black uppercase sm:text-[12px] md:text-[13px]"
            data-no-draw
          >
            Bourgogne · Casablanca
          </p>
          <div
            className="pointer-events-auto text-left text-[11px] leading-[1.35] font-normal tracking-[0.06em] text-black uppercase sm:text-[12px] md:ml-auto md:text-right md:text-[13px]"
            data-no-draw
          >
            <span className="block md:whitespace-nowrap">
              Conception et exécution réunies. Un interlocuteur unique,
            </span>
            <span className="block md:whitespace-nowrap">
              une vision cohérente, une exigence sans compromis.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
