import React, { useLayoutEffect, useState } from "react";

export default function useWindowResize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([globalThis.innerWidth, globalThis.innerHeight]);
    }
    globalThis.addEventListener("resize", updateSize);
    updateSize();
    return () => globalThis.removeEventListener("resize", updateSize);
  }, []);
  return size;
}
