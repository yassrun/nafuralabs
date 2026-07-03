type GsapModule = typeof import("gsap");
type ScrollTriggerModule = typeof import("gsap/ScrollTrigger");

let gsapInstance: GsapModule["gsap"] | null = null;
let scrollTriggerReady = false;

function resolveGsap(mod: GsapModule) {
  const gsap = mod.gsap ?? (mod as { default?: GsapModule["gsap"] }).default;
  if (!gsap) throw new Error("GSAP module did not export gsap");
  return gsap;
}

function resolveScrollTrigger(mod: ScrollTriggerModule) {
  const st =
    mod.ScrollTrigger ??
    (mod as { default?: ScrollTriggerModule["ScrollTrigger"] }).default;
  if (!st) throw new Error("ScrollTrigger module did not export ScrollTrigger");
  return st;
}

/** Load GSAP only in the browser (use inside useEffect). */
export async function loadGsap() {
  if (gsapInstance) return gsapInstance;
  const mod = await import("gsap");
  gsapInstance = resolveGsap(mod);
  return gsapInstance;
}

export async function loadScrollTrigger() {
  const gsap = await loadGsap();
  const mod = await import("gsap/ScrollTrigger");
  const ScrollTrigger = resolveScrollTrigger(mod);

  if (!scrollTriggerReady) {
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerReady = true;
  }

  return { gsap, ScrollTrigger };
}
