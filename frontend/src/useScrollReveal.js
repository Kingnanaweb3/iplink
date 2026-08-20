import { useEffect } from "react";

const TARGETS = [
  ".why-card",
  ".pipeline-card",
  ".proof-panel",
  ".audience-panel",
  ".faq-list",
  ".solution-copy",
  ".solution-visual",
  ".site-footer",
  ".closing-cta",
];

export default function useScrollReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll(TARGETS.join(","));
    nodes.forEach((node, i) => {
      node.classList.add("reveal");
      node.style.setProperty("--reveal-delay", `${(i % 4) * 70}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}
