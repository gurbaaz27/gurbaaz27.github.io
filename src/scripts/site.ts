import {
  fetchCommentCount,
  getArticleCounter,
  updateArticleCounter,
  updatePageview,
} from "@waline/api";
import { siteConfig } from "../config";
import {
  formatCommentCount,
  formatViewCount,
  normalizeWalinePath,
} from "../lib/post-utils";

const nav = document.querySelector<HTMLElement>("#site-nav");
const navToggle = document.querySelector<HTMLButtonElement>("#nav-toggle");
const navLinks = document.querySelector<HTMLElement>("#main-navbar");

navToggle?.addEventListener("click", () => {
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  navLinks?.classList.toggle("open", !expanded);
  nav?.classList.toggle("expanded", !expanded);
});

const syncNav = () => nav?.classList.toggle("short", window.scrollY > 50);
window.addEventListener("scroll", syncNav, { passive: true });
syncNav();

document.querySelector("#change-skin")?.addEventListener("click", () => {
  const enabled = document.documentElement.classList.toggle("dark-mode");
  localStorage.setItem("bj-dark-mode", String(enabled));
});

const highlightToggle = document.querySelector<HTMLButtonElement>("#disable-highlights");
highlightToggle?.addEventListener("click", () => {
  const disabled = document.documentElement.classList.toggle("highlights-disabled");
  highlightToggle.setAttribute("aria-pressed", String(disabled));
  const label = highlightToggle.querySelector<HTMLElement>("[data-highlight-label]");
  if (label) label.textContent = disabled ? "Enable the highlights" : "Disable the highlights";
});

const outlineLinks = [...document.querySelectorAll<HTMLAnchorElement>(".post-outline a")];
const outlineHeadings = outlineLinks
  .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
  .filter((heading): heading is HTMLElement => Boolean(heading));

const syncOutline = () => {
  if (!outlineHeadings.length) return;
  const active = [...outlineHeadings].reverse().find((heading) => heading.getBoundingClientRect().top <= 140) ?? outlineHeadings[0];
  for (const link of outlineLinks) {
    const current = decodeURIComponent(link.hash.slice(1)) === active.id;
    if (current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
};

if (outlineHeadings.length) {
  window.addEventListener("scroll", syncOutline, { passive: true });
  syncOutline();
}

const serverURL = siteConfig.waline.serverURL;
const lang = "en";
const currentPath = normalizeWalinePath(window.location.pathname);
const viewElements = [...document.querySelectorAll<HTMLElement>("[data-waline-view-path]")];
const commentElements = [...document.querySelectorAll<HTMLElement>("[data-waline-comment-path]")];
const upvoteButton = document.querySelector<HTMLButtonElement>("#upvote-btn[data-waline-reaction-path]");
const upvoteCount = document.querySelector<HTMLElement>("#upvote-count");

const paths = [...new Set([
  ...viewElements.map((element) => element.dataset.walineViewPath),
  upvoteButton?.dataset.walineReactionPath,
].filter((path): path is string => Boolean(path)))];

const commentPaths = [...new Set(commentElements
  .map((element) => element.dataset.walineCommentPath)
  .filter((path): path is string => Boolean(path)))];

const REACTION_STORAGE_KEY = "WALINE_REACTION";

const readReactionStore = () => {
  try {
    return JSON.parse(localStorage.getItem(REACTION_STORAGE_KEY) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
};

const writeReactionStore = (store: Record<string, number>) => {
  localStorage.setItem(REACTION_STORAGE_KEY, JSON.stringify(store));
};

const migrateLegacyUpvote = () => {
  if (!upvoteButton) return;
  const path = upvoteButton.dataset.walineReactionPath;
  if (!path) return;

  const legacyKey = `upvoted_${window.location.pathname}`;
  const store = readReactionStore();
  if (store[path] == null && localStorage.getItem(legacyKey) === "true") {
    store[path] = 0;
    writeReactionStore(store);
    localStorage.removeItem(legacyKey);
  }
};

const syncUpvoteState = (count: number) => {
  const path = upvoteButton?.dataset.walineReactionPath;
  const active = Boolean(path && readReactionStore()[path] === 0);
  if (upvoteCount) upvoteCount.textContent = String(count);
  upvoteButton?.classList.toggle("upvoted", active);
  upvoteButton?.setAttribute("aria-pressed", String(active));
};

const incrementCurrentPageview = async () => {
  const hasCurrentCounter = viewElements.some((element) =>
    element.classList.contains("view-count") && element.dataset.walineViewPath === currentPath
  );
  const viewKey = `viewed_${window.location.pathname}`;
  if (!hasCurrentCounter || sessionStorage.getItem(viewKey)) return;

  await updatePageview({ serverURL, lang, path: currentPath });
  sessionStorage.setItem(viewKey, "true");
};

const loadCounters = async () => {
  try {
    await incrementCurrentPageview();
  } catch (error) {
    console.error("Unable to update Waline pageview", error);
  }

  if (paths.length) {
    try {
      const counters = await getArticleCounter({
        serverURL,
        lang,
        paths,
        type: ["time", "reaction0"],
      });
      const byPath = new Map(paths.map((path, index) => [path, counters[index]]));

      for (const element of viewElements) {
        const counter = byPath.get(element.dataset.walineViewPath || "");
        const text = element.querySelector<HTMLElement>(".view-count-text");
        if (text) text.textContent = formatViewCount(counter?.time || 0);
        element.hidden = false;
      }

      const reactionPath = upvoteButton?.dataset.walineReactionPath;
      syncUpvoteState(reactionPath ? byPath.get(reactionPath)?.reaction0 || 0 : 0);
    } catch (error) {
      console.error("Unable to load Waline article counters", error);
    }
  }

  if (commentPaths.length) {
    try {
      const counts = await fetchCommentCount({ serverURL, lang, paths: commentPaths });
      const byPath = new Map(commentPaths.map((path, index) => [path, counts[index] || 0]));

      for (const element of commentElements) {
        const count = byPath.get(element.dataset.walineCommentPath || "") || 0;
        const text = element.querySelector<HTMLElement>(".comment-count-text");
        if (text) text.textContent = formatCommentCount(count);
        element.hidden = count === 0 && element.hasAttribute("data-hide-when-zero");
      }
    } catch (error) {
      console.error("Unable to load Waline comment counters", error);
    }
  }
};

migrateLegacyUpvote();
void loadCounters();

let voting = false;
upvoteButton?.addEventListener("click", async () => {
  const path = upvoteButton.dataset.walineReactionPath;
  if (!path || voting) return;

  voting = true;
  upvoteButton.disabled = true;
  const store = readReactionStore();
  const active = store[path] === 0;

  try {
    const [counter] = await updateArticleCounter({
      serverURL,
      lang,
      path,
      type: "reaction0",
      action: active ? "desc" : "inc",
    });

    if (active) delete store[path];
    else store[path] = 0;
    writeReactionStore(store);
    syncUpvoteState(counter?.reaction0 || 0);
  } catch (error) {
    console.error("Unable to update Waline reaction", error);
  } finally {
    voting = false;
    upvoteButton.disabled = false;
  }
});
