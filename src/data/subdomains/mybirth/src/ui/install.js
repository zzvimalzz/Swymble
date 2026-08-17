/*
   The offer to install.

   Held back until somebody has saved a person. An install bar in front of a first-time visitor
   asks them to keep something they have not seen yet, and it covers the form they came to fill
   in. Once a day is saved the product has a reason to be on a home screen: it changes every
   morning, which nothing else on a phone's second screen does.

   iOS gets a different bar because it has no prompt to fire. Safari will not install anything on
   a page's say-so; the reader has to go through the share sheet themselves, so the only useful
   thing to show them is where that is. It is also the reason this exists at all this early —
   web push on iOS only works once the app has been added to the home screen.
*/

const DISMISS_KEY = "mybirth:install-dismissed";

/** Long enough that a refusal is respected, short enough that a year-old no is not permanent. */
export const DISMISS_DAYS = 60;

/**
 * What, if anything, to show. Pure, and the only real decision in this file.
 *
 * There is no DOM test environment in this project, so anything left inside a listener is a rule
 * nothing checks. Everything below this function is wiring; everything worth arguing about is
 * inside it.
 *
 * @returns {"hidden"|"prompt"|"ios"}
 */
export function installDecision({
  standalone = false,
  promptable = false,
  ios = false,
  dismissedAt = 0,
  savedPeople = 0,
  now = Date.now(),
} = {}) {
  if (standalone) return "hidden";           // already installed; nothing to offer
  if (savedPeople < 1) return "hidden";      // nothing saved yet, so nothing to come back to
  if (dismissedAt && now - dismissedAt < DISMISS_DAYS * 86400000) return "hidden";
  if (promptable) return "prompt";
  if (ios) return "ios";
  return "hidden";
}

/** Running from a home screen rather than a browser tab. */
export function isStandalone() {
  try {
    return matchMedia("(display-mode: standalone)").matches
      || matchMedia("(display-mode: window-controls-overlay)").matches
      || navigator.standalone === true;
  } catch { return false; }
}

/*
   iPadOS reports itself as a Macintosh and has done for years, so the platform string alone
   misses every iPad. A Mac with a touchscreen does not exist, which makes touch points the
   distinguishing fact rather than a heuristic.
*/
export function isIOS() {
  try {
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua)
      || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  } catch { return false; }
}

function readDismissed() {
  try { return parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10) || 0; } catch { return 0; }
}

function writeDismissed(when) {
  try { localStorage.setItem(DISMISS_KEY, String(when)); } catch {}
}

const barHTML = (mode) => `
  <div class="install__inner">
    <p class="install__line">${mode === "ios"
      ? "Keep MyBirth on your home screen: tap Share, then <b>Add to Home Screen</b>."
      : "Keep MyBirth on your home screen. It opens on a different sky every morning."}</p>
    <div class="install__row">
      ${mode === "prompt" ? `<button type="button" class="install__yes" data-install>Add it</button>` : ""}
      <button type="button" class="install__no" data-dismiss>Not now</button>
    </div>
  </div>`;

/**
 * Wire the offer up. Called once, from main.js, which owns every analytics call in the product.
 *
 * @param {object} options
 * @param {() => number} options.savedPeople  how many people are saved, read at decision time
 * @param {() => void}   [options.onOffer]    the bar was shown
 * @param {() => void}   [options.onInstalled] the browser reported an install
 */
export function mountInstall({ savedPeople, onOffer, onInstalled } = {}) {
  let deferred = null;
  let bar = null;

  const decide = () => installDecision({
    standalone: isStandalone(),
    promptable: Boolean(deferred),
    ios: isIOS(),
    dismissedAt: readDismissed(),
    savedPeople: typeof savedPeople === "function" ? savedPeople() : 0,
  });

  /*
     The bar is fixed to the foot of the window, so while it is up it is standing on top of
     whatever the page ends with. On the People tab that was the sentence explaining the calendar
     file. The class gives the document enough room underneath to scroll clear of it.
  */
  const remove = () => {
    bar?.remove();
    bar = null;
    document.body.classList.remove("has-install");
  };

  const show = (mode) => {
    if (bar || mode === "hidden") return;
    bar = document.createElement("aside");
    bar.className = "install";
    bar.setAttribute("aria-label", "Install MyBirth");
    bar.innerHTML = barHTML(mode);

    bar.querySelector("[data-dismiss]")?.addEventListener("click", () => {
      writeDismissed(Date.now());
      remove();
    });

    bar.querySelector("[data-install]")?.addEventListener("click", async () => {
      if (!deferred) return;
      const prompt = deferred;
      // the event is single-use: a second prompt() on the same one throws
      deferred = null;
      remove();
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        // a refusal at the browser's own dialog is a firmer no than closing our bar
        if (outcome !== "accepted") writeDismissed(Date.now());
      } catch {}
    });

    document.body.appendChild(bar);
    document.body.classList.add("has-install");
    // one frame so the entrance transition has a state to come from
    requestAnimationFrame(() => bar?.classList.add("is-in"));
    onOffer?.();
  };

  addEventListener("beforeinstallprompt", (event) => {
    // without this Chrome shows its own mini-infobar and ours as well
    event.preventDefault();
    deferred = event;
    show(decide());
  });

  addEventListener("appinstalled", () => {
    deferred = null;
    remove();
    onInstalled?.();
  });

  /*
     Safari fires no beforeinstallprompt, so the iOS bar has nothing to wait for. It is delayed
     rather than shown on load because arriving to a bar across the bottom of the page reads as
     an ad, and because the decision depends on saves that may still be being written.
  */
  setTimeout(() => { if (!bar) show(decide()); }, 4000);

  return { refresh: () => show(decide()), close: remove };
}
