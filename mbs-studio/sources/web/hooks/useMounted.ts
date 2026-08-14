"use client";

import { useEffect, useState } from "react";

/** True only after the client has mounted — avoids SSR/hydration mismatches. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
