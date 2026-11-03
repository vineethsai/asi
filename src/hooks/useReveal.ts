import { useCallback, useEffect, useState } from "react";

export interface RevealOptions {
  /** Passed to IntersectionObserver. Default "0px 0px -10% 0px" (reveal slightly before fully in view). */
  rootMargin?: string;
  /** Passed to IntersectionObserver. Default 0.1. */
  threshold?: number;
}

/**
 * Reveal-once hook for entrance animations (IMPROVEMENT_PLAN §8.1).
 *
 * Attach `ref` to a container; the first time it intersects the viewport the hook adds the
 * `is-visible` class and a `data-visible` attribute to it (the attribute survives React
 * re-writing `className`), and `isVisible` flips to true. Children with the `.enter` class
 * then fade/rise in, staggered by their `--i` custom property (see `stagger()` in lib/motion).
 *
 * @example
 * const { ref } = useReveal<HTMLDivElement>();
 * <div ref={ref}>{items.map((x, i) => <Card key={x.id} className="enter" style={stagger(i)} />)}</div>
 */
export function useReveal<T extends Element = HTMLDivElement>(options: RevealOptions = {}) {
  const { rootMargin = "0px 0px -10% 0px", threshold = 0.1 } = options;
  const [node, setNode] = useState<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const ref = useCallback((el: T | null) => setNode(el), []);

  useEffect(() => {
    if (!node || isVisible) return;
    const reveal = () => {
      node.classList.add("is-visible");
      node.setAttribute("data-visible", "");
      setIsVisible(true);
    };
    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, isVisible, rootMargin, threshold]);

  return { ref, isVisible };
}

export default useReveal;
