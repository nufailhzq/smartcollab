"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { EN_TO_MS, MS_TO_EN } from "@/lib/translations";

const STORAGE_KEY = "ukmfolio-lang";

type Lang = "ms" | "en";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "SVG",
]);
const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

/**
 * Cache of every text node's original Malay value. Lets BM ↔ EN flipping
 * be lossless even when several Malay phrases collapse to the same English
 * string.
 */
const textOriginals = new WeakMap<Text, string>();

function shouldSkipElement(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.getAttribute("translate") === "no") return true;
  if (el.classList.contains("notranslate")) return true;
  if ((el as HTMLElement).dataset?.noTranslate !== undefined) return true;
  return false;
}

function inSkippedSubtree(node: Node): boolean {
  let cur: Node | null = node.parentNode;
  while (cur) {
    if (cur.nodeType === Node.ELEMENT_NODE && shouldSkipElement(cur as Element)) return true;
    cur = cur.parentNode;
  }
  return false;
}

function translateTextNode(node: Text, lang: Lang) {
  const value = node.nodeValue ?? "";
  const trimmed = value.trim();
  if (!trimmed) return;

  if (lang === "en") {
    if (!textOriginals.has(node)) textOriginals.set(node, value);
    const en = MS_TO_EN[trimmed];
    if (!en) return;
    const next = value.replace(trimmed, en);
    if (next !== value) node.nodeValue = next;
  } else {
    const orig = textOriginals.get(node);
    if (orig !== undefined) {
      if (node.nodeValue !== orig) node.nodeValue = orig;
      return;
    }
    const ms = EN_TO_MS[trimmed];
    if (!ms) return;
    const next = value.replace(trimmed, ms);
    if (next !== value) node.nodeValue = next;
  }
}

function translateAttribute(el: Element, attr: string, lang: Lang) {
  const cacheKey = `data-orig-${attr}`;
  const current = el.getAttribute(attr);
  if (current === null) return;

  if (lang === "en") {
    const trimmed = current.trim();
    if (!trimmed) return;
    const en = MS_TO_EN[trimmed];
    if (!en) return;
    if (!el.hasAttribute(cacheKey)) el.setAttribute(cacheKey, current);
    const next = current.replace(trimmed, en);
    if (next !== current) el.setAttribute(attr, next);
  } else {
    const original = el.getAttribute(cacheKey);
    if (original !== null) {
      if (el.getAttribute(attr) !== original) el.setAttribute(attr, original);
      el.removeAttribute(cacheKey);
      return;
    }
    const trimmed = current.trim();
    const ms = EN_TO_MS[trimmed];
    if (!ms) return;
    const next = current.replace(trimmed, ms);
    if (next !== current) el.setAttribute(attr, next);
  }
}

function translateSubtree(root: Node, lang: Lang) {
  if (root.nodeType === Node.ELEMENT_NODE && shouldSkipElement(root as Element)) return;

  // Text nodes
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      inSkippedSubtree(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const batch: Text[] = [];
  let cur: Node | null;
  while ((cur = walker.nextNode())) batch.push(cur as Text);
  for (const t of batch) translateTextNode(t, lang);

  // Attributes
  if (root.nodeType === Node.ELEMENT_NODE) {
    const rootEl = root as Element;
    const sel = "[placeholder],[title],[aria-label],[alt]";
    const list: Element[] = [];
    if (rootEl.matches?.(sel)) list.push(rootEl);
    rootEl.querySelectorAll(sel).forEach((e) => list.push(e));
    for (const el of list) {
      if (shouldSkipElement(el) || inSkippedSubtree(el)) continue;
      for (const attr of TRANSLATABLE_ATTRS) translateAttribute(el, attr, lang);
    }
  }
}

/**
 * Local-dictionary BM ↔ EN toggle. Walks the DOM on mount, on toggle, and
 * after route changes — no MutationObserver, so it never fights React's
 * reconciler. Dynamic in-page content (modals, dropdowns) that mounts later
 * stays in its original language until the next navigation or toggle click.
 */
export function TranslateToggle() {
  const [lang, setLang] = useState<Lang>("ms");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Hydrate the preference once on first client render.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setLang(saved === "en" ? "en" : "ms");
    setMounted(true);
  }, []);

  // Re-apply whenever lang or route changes. We defer to the next animation
  // frame so React's commit finishes first — translating mid-commit would
  // race with reconciliation and could break event handlers.
  useEffect(() => {
    if (!mounted) return;
    if (typeof document === "undefined") return;
    const id = requestAnimationFrame(() => translateSubtree(document.body, lang));
    return () => cancelAnimationFrame(id);
  }, [lang, pathname, mounted]);

  function toggle() {
    const next: Lang = lang === "ms" ? "en" : "ms";
    setLang(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / quota — preference just won't persist */
    }
  }

  const showEn = mounted && lang === "en";

  return (
    <button
      type="button"
      onClick={toggle}
      translate="no"
      title={
        showEn ? "Switch to Bahasa Malaysia" : "Tukar ke English / Switch to English"
      }
      aria-label="Pilih bahasa"
      className="notranslate inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold uppercase tracking-wider shadow-soft transition hover:-translate-y-0.5 hover:border-ukm-teal hover:shadow-glow"
    >
      <Languages size={12} className="text-slate-400" />
      <span
        className={`rounded-full px-1.5 py-0.5 transition ${
          !showEn ? "bg-ukm-orange text-white" : "text-slate-500"
        }`}
      >
        BM
      </span>
      <span
        className={`rounded-full px-1.5 py-0.5 transition ${
          showEn ? "bg-ukm-teal text-white" : "text-slate-500"
        }`}
      >
        EN
      </span>
    </button>
  );
}
