
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

let particles = [];
let width = 0;
let height = 0;
let animationFrame;

function createParticle() {
    return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.2 + 0.35,
        speed: Math.random() * 0.18 + 0.04,
        alpha: Math.random() * 0.38 + 0.22,
        phase: Math.random() * Math.PI * 2,
        sparkle: Math.random() < 0.2
    };
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particleCount = Math.min(260, Math.max(100, Math.round(width * height / 3200)));
    particles = Array.from({ length: particleCount }, createParticle);
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
        particle.y -= particle.speed;
        particle.phase += 0.025;

        if (particle.y < 0) {
            particle.y = height;
            particle.x = Math.random() * width;
        }

        const glow = particle.alpha * (0.65 + Math.sin(particle.phase) * 0.35);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 211, 125, ${glow})`;
        ctx.shadowBlur = 7;
        ctx.shadowColor = "#e7a73e";
        ctx.fill();

        if (particle.sparkle) {
            const sparkleGlow = Math.max(0, Math.sin(particle.phase * 1.7)) * particle.alpha;
            if (sparkleGlow > 0.08) {
                const rayLength = particle.radius * 4.5;
                ctx.beginPath();
                ctx.moveTo(particle.x - rayLength, particle.y);
                ctx.lineTo(particle.x + rayLength, particle.y);
                ctx.moveTo(particle.x, particle.y - rayLength);
                ctx.lineTo(particle.x, particle.y + rayLength);
                ctx.strokeStyle = `rgba(255, 240, 196, ${sparkleGlow})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
        }
    }

    ctx.shadowBlur = 0;
    animationFrame = requestAnimationFrame(animate);
}

resizeCanvas();
animate();

window.addEventListener("resize", resizeCanvas);

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cancelAnimationFrame(animationFrame);
    ctx.clearRect(0, 0, width, height);
}

const introCover = document.getElementById("intro-cover");
const invitation = document.querySelector(".invitation");
const bookStage = document.getElementById("book-stage");
const bookUnder = document.getElementById("book-under");
const bookLeaf = document.getElementById("book-leaf");
const leafFront = document.getElementById("leaf-front");
const leafBack = document.getElementById("leaf-back");
const previousPageButton = document.getElementById("previous-page");
const nextPageButton = document.getElementById("next-page");
const pauseButton = document.getElementById("toggle-autoplay");
const musicButton = document.getElementById("toggle-music");
const backgroundMusic = document.getElementById("background-music");
const coverContent = document.querySelector(".cover");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pageSources = [
    "assets/img/page1.png",
    "assets/img/page2.png",
    "assets/img/page3.png",
    "assets/img/page4.png"
];
const flipDuration = 1250;
const pageDuration = 8000;
const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const invitationConfig = {
    celebrantName: "Shirley Sofia",
    dedication: "Quince años de sueños y alegría. Gracias por acompañarme en esta nueva etapa.",
    familyThanks: "Quince años de sueños y alegría, gracias por acompañarme con tanto amor y apoyo en esta nueva etapa.",
    parents: { mother: "Silvia Mejía M.", father: "Olger Ccalta Cc." },
    godparents: ["Jaime Mamani Ccalta", "Sandra Mejía Mio", "Yesenia Ccoa Chullo"],
    event: {
        callout: "¡No puedo esperar\npara celebrar contigo!",
        year: 2026,
        month: 10,
        day: 21,
        time: "6:00 PM",
        place: "Salón Palace",
        address: "Frente al Centro de Salud de Peruarbo"
    },
    whatsapp: {
        number: "+51 913 894 733",
        message: "¡Hola! Confirmo mi asistencia a los XV años de Shirley Sofia. ¡Muchas gracias por la invitación!\n\nPor favor, confirma tu nombre:"
    }
};

function parseEventTime(time) {
    const time24 = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
    if (time24) {
        return [Number(time24[1]), Number(time24[2])];
    }

    const time12 = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i.exec(time);
    if (!time12) return null;

    const hour = Number(time12[1]) % 12;
    return [hour + (time12[3].toUpperCase() === "PM" ? 12 : 0), Number(time12[2])];
}

function parseEventDate(event) {
    if (!Number.isInteger(event.year)) {
        return null;
    }

    const time = parseEventTime(event.time);
    if (event.time && !time) return null;

    const [hours, minutes] = time || [0, 0];
    const date = new Date(event.year, event.month, event.day, hours, minutes, 0, 0);

    if (date.getFullYear() !== event.year || date.getMonth() !== event.month || date.getDate() !== event.day) {
        return null;
    }

    return date;
}

const configuredEventDate = parseEventDate(invitationConfig.event);
const hasConfiguredEventTime = Boolean(parseEventTime(invitationConfig.event.time));

let currentPage = -1;
let targetPage = 0;
let autoplayTimer;
let flipFallbackTimer;
let autoplayActive = !reduceMotion.matches;
let manuallyPaused = false;
let isTurning = false;
let bookStarted = false;
let musicUserActivated = false;
let introOpened = false;

function createPageContent(pageIndex) {
    const content = document.createElement("div");
    content.className = "book-page-content";

    const art = document.createElement("img");
    art.className = "book-art";
    art.alt = "";
    art.draggable = false;

    if (pageIndex === -1) {
        art.src = "assets/img/portada.png";
        content.classList.add("book-page-content--cover");
        content.append(art, coverContent.cloneNode(true));
        return content;
    }

    art.src = pageSources[pageIndex];
    const template = document.getElementById(`page${pageIndex + 1}-content`);
    content.append(art, template.content.cloneNode(true));
    renderPageData(content);
    return content;
}

function setPageSurface(container, pageIndex) {
    container.replaceChildren(createPageContent(pageIndex));
}

function renderPageData(root) {
    root.querySelectorAll("[data-config]").forEach(element => {
        const value = element.dataset.config.split(".").reduce((current, key) => current?.[key], invitationConfig);
        element.textContent = value ?? "";
    });

    root.querySelectorAll("[data-family]").forEach(element => {
        element.textContent = invitationConfig.parents[element.dataset.family];
    });

    root.querySelectorAll("[data-godparent]").forEach(element => {
        element.textContent = invitationConfig.godparents[Number(element.dataset.godparent)];
    });

    const dateLabel = root.querySelector("[data-event-date]");
    if (dateLabel) {
        dateLabel.textContent = `${invitationConfig.event.day} de ${monthNames[invitationConfig.event.month]}`;
    }

    const year = root.querySelector("[data-event-year]");
    if (year) {
        year.textContent = Number.isInteger(invitationConfig.event.year)
            ? ` · ${invitationConfig.event.year}`
            : " · Año por confirmar";
    }

    const eventTime = root.querySelector("[data-event-time]");
    if (eventTime) eventTime.textContent = invitationConfig.event.time || "[HORA]";

    const eventPlace = root.querySelector("[data-event-place]");
    if (eventPlace) eventPlace.textContent = invitationConfig.event.place;

    const eventAddress = root.querySelector("[data-event-address]");
    if (eventAddress) eventAddress.textContent = invitationConfig.event.address;

    root.querySelectorAll("[data-schedule-index]").forEach(item => {
        const entry = invitationConfig.schedule[Number(item.dataset.scheduleIndex)];
        item.querySelector("[data-schedule-title]").textContent = entry.title;
        item.querySelector("[data-schedule-time]").textContent = entry.time;
        item.querySelector("[data-schedule-description]").textContent = entry.description;
    });

    const whatsappLink = root.querySelector("[data-whatsapp-link]");
    if (whatsappLink) {
        const number = invitationConfig.whatsapp.number.replace(/\D/g, "");
        whatsappLink.href = `https://wa.me/${number}?text=${encodeURIComponent(invitationConfig.whatsapp.message)}`;
    }

    renderCountdown(root, Date.now());
}

function nextPageIndex(pageIndex) {
    return pageIndex >= pageSources.length - 1 ? -1 : pageIndex + 1;
}

function previousPageIndex(pageIndex) {
    return pageIndex < 0 ? pageSources.length - 1 : pageIndex - 1;
}

function updatePauseButton() {
    const label = autoplayActive ? "Pausar avance automático" : "Reanudar avance automático";
    pauseButton.textContent = autoplayActive ? "Ⅱ" : "▶";
    pauseButton.setAttribute("aria-label", label);
    pauseButton.setAttribute("title", label);
    pauseButton.setAttribute("aria-pressed", String(autoplayActive));
}

function scheduleNextTurn() {
    window.clearTimeout(autoplayTimer);
    if (!autoplayActive || isTurning) {
        return;
    }

    autoplayTimer = window.setTimeout(beginPageTurn, pageDuration);
}

function finishPageTurn() {
    if (!isTurning) {
        return;
    }

    window.clearTimeout(flipFallbackTimer);
    currentPage = targetPage;
    bookLeaf.classList.add("is-hidden");
    bookLeaf.classList.remove("is-turning");
    bookLeaf.classList.remove("book-leaf--backward");
    bookStage.classList.remove("is-turning");
    setPageSurface(bookUnder, currentPage);
    setPageSurface(leafFront, currentPage);
    setPageSurface(leafBack, nextPageIndex(currentPage));
    isTurning = false;
    scheduleNextTurn();
}

function beginPageTurn(direction = 1, manual = false) {
    if ((!autoplayActive && !manual) || isTurning) {
        return;
    }

    window.clearTimeout(autoplayTimer);
    targetPage = currentPage < 0
        ? (direction > 0 ? 0 : pageSources.length - 1)
        : (direction > 0 ? nextPageIndex(currentPage) : previousPageIndex(currentPage));
    setPageSurface(bookUnder, targetPage);
    setPageSurface(leafFront, currentPage);
    setPageSurface(leafBack, targetPage);
    bookLeaf.classList.remove("is-hidden");
    bookLeaf.classList.toggle("book-leaf--backward", direction < 0);
    bookStage.classList.add("is-turning");
    isTurning = true;

    bookLeaf.getAnimations().forEach(animation => animation.cancel());
    bookLeaf.offsetWidth;
    bookLeaf.classList.add("is-turning");
    flipFallbackTimer = window.setTimeout(finishPageTurn, flipDuration + 150);
}

function toggleAutoplay() {
    autoplayActive = !autoplayActive;
    manuallyPaused = !autoplayActive;
    window.clearTimeout(autoplayTimer);

    if (autoplayActive) {
        if (isTurning) {
            bookLeaf.getAnimations().forEach(animation => animation.play());
        } else {
            scheduleNextTurn();
        }
    } else if (!isTurning) {
        window.clearTimeout(flipFallbackTimer);
    }

    updatePauseButton();
}

function showMusicError(error) {
    const autoplayBlocked = error.name === "NotAllowedError";
    const label = autoplayBlocked
        ? "Reproducir música"
        : "No se pudo reproducir la música";
    musicButton.setAttribute("aria-label", label);
    musicButton.setAttribute("title", autoplayBlocked
        ? "El navegador bloqueó la reproducción automática. Toca para reproducir."
        : label);
    musicButton.setAttribute("aria-pressed", "false");
    musicButton.textContent = "▶";

    if (!autoplayBlocked) {
        console.error("No se pudo reproducir el archivo de música.", error);
    }
}

function startMusic(userInitiated = false) {
    if (userInitiated) {
        musicUserActivated = true;
        backgroundMusic.muted = false;
    }

    backgroundMusic.play().then(updateMusicButton).catch(error => {
        if (error.name === "NotAllowedError" && !musicUserActivated) {
            backgroundMusic.muted = true;
            backgroundMusic.play().then(updateMusicButton).catch(showMusicError);
            return;
        }

        showMusicError(error);
    });
}

function updateMusicButton() {
    const label = backgroundMusic.paused
        ? "Reproducir música"
        : backgroundMusic.muted ? "Activar sonido" : "Silenciar música";
    musicButton.textContent = backgroundMusic.paused ? "▶" : backgroundMusic.muted ? "♩" : "♫";
    musicButton.setAttribute("aria-label", label);
    musicButton.setAttribute("title", label);
    musicButton.setAttribute("aria-pressed", String(!backgroundMusic.paused && !backgroundMusic.muted));
}

function toggleMusic() {
    if (backgroundMusic.paused) {
        backgroundMusic.muted = false;
        startMusic(true);
        return;
    }

    backgroundMusic.muted = !backgroundMusic.muted;
    updateMusicButton();
}

function startBook() {
    if (bookStarted) {
        return;
    }

    bookStarted = true;
    invitation.classList.add("book-active");
    resizeCanvas();
    bookStage.hidden = false;

    if (reduceMotion.matches) {
        currentPage = 0;
        setPageSurface(bookUnder, 0);
        setPageSurface(leafFront, 0);
        setPageSurface(leafBack, 1);
        bookLeaf.classList.add("is-hidden");
    } else {
        setPageSurface(bookUnder, 0);
        setPageSurface(leafFront, -1);
        setPageSurface(leafBack, 0);
    }

    scheduleNextTurn();
}

function openIntro() {
    if (!introCover || introOpened) {
        return;
    }

    introOpened = true;
    startMusic(true);

    if (reduceMotion.matches) {
        introCover.remove();
        startBook();
        return;
    }

    introCover.classList.add("is-opening");
    window.setTimeout(() => {
        introCover.remove();
        startBook();
    }, 1300);
}

pauseButton.addEventListener("click", toggleAutoplay);
previousPageButton.addEventListener("click", () => beginPageTurn(-1, true));
nextPageButton.addEventListener("click", () => beginPageTurn(1, true));
musicButton.addEventListener("click", toggleMusic);
backgroundMusic.addEventListener("play", updateMusicButton);
backgroundMusic.addEventListener("pause", updateMusicButton);
if (introCover) {
    introCover.addEventListener("click", openIntro);
    introCover.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openIntro();
        }
    });
} else {
    startBook();
}
reduceMotion.addEventListener("change", event => {
    if (event.matches) {
        autoplayActive = false;
        window.clearTimeout(autoplayTimer);
        updatePauseButton();
    } else if (!manuallyPaused && bookStarted && !isTurning) {
        autoplayActive = true;
        updatePauseButton();
        scheduleNextTurn();
    }
});
bookLeaf.addEventListener("transitionend", event => {
    if (event.target === bookLeaf && event.propertyName === "transform") {
        finishPageTurn();
    }
});

function renderCountdown(root, timestamp) {
    const state = root.querySelector("[data-countdown-state]");
    const units = root.querySelector("[data-countdown-values]");
    if (!state || !units) return;

    if (!configuredEventDate) {
        state.hidden = false;
        state.textContent = "Cuenta regresiva no disponible por el momento.";
        units.hidden = true;
        return;
    }

    const currentDate = new Date(timestamp);
    const eventDay = new Date(configuredEventDate.getFullYear(), configuredEventDate.getMonth(), configuredEventDate.getDate());
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    if (eventDay < today) {
        state.hidden = false;
        state.textContent = "La fecha del evento ya pasó. Gracias por haber sido parte de esta celebración.";
        units.hidden = true;
        return;
    }

    if (eventDay.getTime() === today.getTime() && !hasConfiguredEventTime) {
        state.hidden = false;
        state.textContent = "¡Hoy es el gran día!";
        units.hidden = true;
        return;
    }

    const remaining = Math.max(0, configuredEventDate.getTime() - timestamp);
    if (remaining === 0) {
        state.hidden = false;
        state.textContent = "La fecha del evento ya pasó. Gracias por haber sido parte de esta celebración.";
        units.hidden = true;
        return;
    }

    state.hidden = true;
    units.hidden = false;
    const values = {
        days: Math.floor(remaining / 86400000),
        hours: Math.floor((remaining % 86400000) / 3600000),
        minutes: Math.floor((remaining % 3600000) / 60000),
        seconds: Math.floor((remaining % 60000) / 1000)
    };

    units.querySelectorAll("[data-countdown]").forEach(element => {
        element.textContent = String(values[element.dataset.countdown]).padStart(2, "0");
    });
}

updatePauseButton();
renderCountdown(document, Date.now());

if (configuredEventDate && configuredEventDate.getTime() > Date.now()) {
    const countdownTimer = window.setInterval(() => {
        renderCountdown(document, Date.now());
        if (configuredEventDate.getTime() <= Date.now()) {
            window.clearInterval(countdownTimer);
        }
    }, 1000);
}

if (!backgroundMusic.currentSrc && !backgroundMusic.getAttribute("src") && !backgroundMusic.querySelector("source")) {
    musicButton.disabled = true;
} else {
    musicButton.disabled = false;
}
