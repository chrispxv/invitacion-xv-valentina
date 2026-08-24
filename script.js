// Central event settings. Replace the empty values when the final details arrive.
const EVENT_CONFIG = Object.freeze({
  celebrant: "Valentina Pimentel",
  eventDate: "2026-10-03T19:00:00-05:00",
  timeZone: "America/Lima",
  venue: "Círculo Militar de Chorrillos",
  city: "Lima, Perú",
  mapsUrl: "",
  whatsappNumber: "", // Add the number with country code, e.g. 519XXXXXXXX.
  whatsappMessage: "Hola, confirmo mi asistencia a los XV de Valentina Pimentel ✨",
  musicPath: "./assets/audio/music.mp3",
  giftsEnabled: true,
  galleryImages: [] // Example: ["./assets/images/gallery/foto-1.jpg"]
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const openingScene = document.querySelector("#inicio");
const openButton = document.querySelector("#openInvitation");
const musicControl = document.querySelector("#musicControl");
const ambientMusic = document.querySelector("#ambientMusic");

function openInvitation() {
  if (!openingScene || openingScene.classList.contains("is-open")) return;

  openingScene.classList.add("is-open");
  document.body.classList.add("invitation-open");
  openButton?.setAttribute("aria-expanded", "true");
  openButton?.setAttribute("aria-label", "Invitación abierta");

  if (ambientMusic) {
    ambientMusic.src = EVENT_CONFIG.musicPath;
    ambientMusic.volume = 0.42;
    const playAttempt = ambientMusic.play();

    if (playAttempt) {
      playAttempt
        .then(() => {
          musicControl.hidden = false;
        })
        .catch(() => {
          // Music is optional. The invitation stays fully functional without it.
          musicControl.hidden = true;
        });
    }
  }
}

openButton?.addEventListener("click", openInvitation);

ambientMusic?.addEventListener("error", () => {
  musicControl.hidden = true;
});

musicControl?.addEventListener("click", () => {
  if (!ambientMusic) return;
  ambientMusic.muted = !ambientMusic.muted;
  musicControl.setAttribute("aria-pressed", String(ambientMusic.muted));
  musicControl.setAttribute("aria-label", ambientMusic.muted ? "Activar música" : "Silenciar música");
});

function pad(value, length = 2) {
  return String(Math.max(0, value)).padStart(length, "0");
}

function updateCountdown() {
  const target = new Date(EVENT_CONFIG.eventDate).getTime();
  const distance = target - Date.now();
  const countdown = document.querySelector("#countdown");
  const finished = document.querySelector("#countdownFinished");

  if (!Number.isFinite(target) || distance <= 0) {
    if (countdown) countdown.hidden = true;
    if (finished) finished.hidden = false;
    return false;
  }

  const days = Math.floor(distance / 86_400_000);
  const hours = Math.floor((distance % 86_400_000) / 3_600_000);
  const minutes = Math.floor((distance % 3_600_000) / 60_000);
  const seconds = Math.floor((distance % 60_000) / 1_000);

  document.querySelector("#days").textContent = String(days);
  document.querySelector("#hours").textContent = pad(hours);
  document.querySelector("#minutes").textContent = pad(minutes);
  document.querySelector("#seconds").textContent = pad(seconds);
  return true;
}

updateCountdown();
const countdownTimer = window.setInterval(() => {
  if (!updateCountdown()) window.clearInterval(countdownTimer);
}, 1000);

function setActionLinks() {
  const mapsFallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${EVENT_CONFIG.venue}, ${EVENT_CONFIG.city}`)}`;
  const mapsButton = document.querySelector("#mapsButton");
  if (mapsButton) mapsButton.href = EVENT_CONFIG.mapsUrl || mapsFallback;

  const rsvpButton = document.querySelector("#rsvpButton");
  const phone = EVENT_CONFIG.whatsappNumber.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(EVENT_CONFIG.whatsappMessage)}`;
  if (rsvpButton) {
    rsvpButton.href = whatsappUrl;
    rsvpButton.target = "_blank";
    rsvpButton.rel = "noopener noreferrer";
  }

  const calendarParams = new URLSearchParams({
    action: "TEMPLATE",
    text: `XV de ${EVENT_CONFIG.celebrant}`,
    dates: "20261003T190000/20261004T000000",
    ctz: EVENT_CONFIG.timeZone,
    details: "Acompáñame a celebrar mis XV años.",
    location: `${EVENT_CONFIG.venue}, ${EVENT_CONFIG.city}`
  });
  const calendarButton = document.querySelector("#calendarButton");
  if (calendarButton) calendarButton.href = `https://calendar.google.com/calendar/render?${calendarParams.toString()}`;
}

function initializeOptionalSections() {
  const gifts = document.querySelector("#gifts");
  if (gifts && !EVENT_CONFIG.giftsEnabled) gifts.hidden = true;

  const gallerySection = document.querySelector("#gallerySection");
  const galleryGrid = document.querySelector("#galleryGrid");
  if (!gallerySection || !galleryGrid || EVENT_CONFIG.galleryImages.length === 0) return;

  EVENT_CONFIG.galleryImages.forEach((source, index) => {
    const figure = document.createElement("figure");
    figure.className = "reveal";
    const image = document.createElement("img");
    image.src = source;
    image.alt = `Momento especial de Valentina ${index + 1}`;
    image.loading = "lazy";
    image.decoding = "async";
    figure.append(image);
    galleryGrid.append(figure);
  });
  gallerySection.hidden = false;
}

setActionLinks();
initializeOptionalSections();

const revealElements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -5%" });

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const fifteenNumber = document.querySelector("#fifteenNumber");
let scrollFrame = 0;

function updateParallax() {
  scrollFrame = 0;
  if (!fifteenNumber || reducedMotion.matches) return;
  const rect = fifteenNumber.parentElement.getBoundingClientRect();
  const shift = Math.max(-18, Math.min(18, (window.innerHeight / 2 - rect.top) * 0.035));
  fifteenNumber.style.transform = `translate3d(0, ${shift}px, 0)`;
}

window.addEventListener("scroll", () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(updateParallax);
}, { passive: true });

updateParallax();
