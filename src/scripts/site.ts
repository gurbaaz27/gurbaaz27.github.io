declare const firebase: { database(): any };

const formatCount = (count: number) => count >= 1_000_000
  ? `${(count / 1_000_000).toFixed(1)}M views`
  : count >= 1_000
    ? `${(count / 1_000).toFixed(1)}K views`
    : `${count} ${count === 1 ? "view" : "views"}`;

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

document.querySelector("#disable-highlights")?.addEventListener("click", () => {
  document.documentElement.classList.add("highlights-disabled");
});

let database: any;
try { database = firebase?.database(); } catch { /* third-party integration unavailable */ }

const path = window.location.pathname;
if (database) {
  const viewRef = database.ref(`views/${encodeURIComponent(path)}`);
  const viewKey = `viewed_${path}`;
  if (!sessionStorage.getItem(viewKey) && document.querySelector(".view-count")) {
    viewRef.transaction((count: number | null) => (count || 0) + 1, (error: unknown, committed: boolean) => {
      if (!error && committed) sessionStorage.setItem(viewKey, "true");
    });
  }

  viewRef.once("value", (snapshot: any) => {
    document.querySelectorAll<HTMLElement>(".view-count").forEach((element) => {
      const text = element.querySelector<HTMLElement>(".view-count-text");
      if (text) text.textContent = formatCount(snapshot.val() || 0);
      element.hidden = false;
    });
  });

  document.querySelectorAll<HTMLElement>(".post-view-count").forEach((element) => {
    const postUrl = element.dataset.postUrl;
    if (!postUrl) return;
    database.ref(`views/${encodeURIComponent(postUrl)}`).once("value", (snapshot: any) => {
      const text = element.querySelector<HTMLElement>(".view-count-text");
      if (text) text.textContent = formatCount(snapshot.val() || 0);
      element.hidden = false;
    });
  });

  const upvoteButton = document.querySelector<HTMLButtonElement>("#upvote-btn");
  const upvoteCount = document.querySelector<HTMLElement>("#upvote-count");
  const upvoteKey = `upvoted_${path}`;
  const upvoteRef = database.ref(`upvotes/${encodeURIComponent(path)}`);
  const syncUpvote = (count: number) => {
    if (upvoteCount) upvoteCount.textContent = String(count);
    upvoteButton?.classList.toggle("upvoted", localStorage.getItem(upvoteKey) === "true");
  };
  upvoteRef.once("value", (snapshot: any) => syncUpvote(snapshot.val() || 0));
  upvoteButton?.addEventListener("click", () => {
    const already = localStorage.getItem(upvoteKey) === "true";
    upvoteRef.transaction((count: number | null) => already ? Math.max(0, (count || 0) - 1) : (count || 0) + 1, (error: unknown, committed: boolean, snapshot: any) => {
      if (error || !committed) return;
      already ? localStorage.removeItem(upvoteKey) : localStorage.setItem(upvoteKey, "true");
      syncUpvote(snapshot.val() || 0);
    });
  });
}
