const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const projectsList = document.querySelector("#project-list");
const ignoredRepositoryNames = new Set(["Lama-Raj", "Lama-Raj.github.io"]);

// --- Navigation Toggle ---
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// --- GitHub Projects Loader ---
async function loadGitHubProjects() {
  if (!projectsList) return;

  const cachedProjects = sessionStorage.getItem("github_portfolio_cache");
  if (cachedProjects) {
    projectsList.innerHTML = cachedProjects;
    return;
  }

  const githubUser = projectsList.dataset.githubUser;
  if (!githubUser) {
    projectsList.innerHTML =
      '<p class="projects-status">No GitHub user configured.</p>';
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(githubUser)}/repos?sort=pushed&direction=desc&per_page=10`,
      { headers: { Accept: "application/vnd.github+json" } },
    );

    if (!response.ok)
      throw new Error(`GitHub request failed: ${response.status}`);

    const repositories = await response.json();
    const recentProjects = repositories
      .filter(
        (repo) =>
          !repo.fork &&
          !repo.archived &&
          !ignoredRepositoryNames.has(repo.name),
      )
      .slice(0, 5);

    const repositoriesWithLanguages = await Promise.all(
      recentProjects.map(async (repo) => {
        if (!repo.languages_url) return { ...repo, languages: [] };

        try {
          const langRes = await fetch(repo.languages_url, {
            headers: { Accept: "application/vnd.github+json" },
          });
          if (!langRes.ok)
            return { ...repo, languages: repo.language ? [repo.language] : [] };

          const languageMap = await langRes.json();
          const languages = Object.entries(languageMap)
            .sort((a, b) => b[1] - a[1])
            .map(([lang]) => lang)
            .slice(0, 3);

          return {
            ...repo,
            languages: languages.length
              ? languages
              : repo.language
                ? [repo.language]
                : [],
          };
        } catch {
          return { ...repo, languages: repo.language ? [repo.language] : [] };
        }
      }),
    );

    if (!repositoriesWithLanguages.length) {
      projectsList.innerHTML =
        '<p class="projects-status">No recent projects found.</p>';
      return;
    }

    const finalHTML = repositoriesWithLanguages
      .map((repo) => {
        const desc = repo.description || "No description provided yet.";
        const date = repo.pushed_at
          ? new Date(repo.pushed_at).toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })
          : "Recently updated";

        return `
        <article class="project-row">
          <div class="project-info">
            <h3>${repo.name}</h3>
            <p>${desc}</p>
            <div class="project-langs">
              ${(repo.languages || []).map((lang) => `<span class="lang-tag">${lang}</span>`).join("")}
            </div>
          </div>
          <div class="project-meta">
            <span class="project-date">Updated: ${date}</span>
            <a class="link-text" href="${repo.html_url}" target="_blank" rel="noopener">View Source &rarr;</a>
          </div>
        </article>
      `;
      })
      .join("");

    projectsList.innerHTML = finalHTML;
    sessionStorage.setItem("github_portfolio_cache", finalHTML);
  } catch (error) {
    console.error("GitHub API Error:", error);
    projectsList.innerHTML =
      '<p class="projects-status">Could not load projects. Try again later.</p>';
  }
}
loadGitHubProjects();

// --- Background Scroll Fade Effect ---
window.addEventListener("scroll", () => {
  const maxOpacity = 0.6;
  const newOpacity = Math.max(
    0,
    maxOpacity - (window.scrollY / 700) * maxOpacity,
  );
  document.documentElement.style.setProperty(
    "--bg-opacity",
    newOpacity.toFixed(3),
  );
});

// --- Dark Mode Logic ---
const toggleSwitch = document.querySelector(
  '.theme-switch input[type="checkbox"]',
);
if (localStorage.getItem("portfolio-theme") === "dark") {
  document.body.classList.add("dark-theme");
  if (toggleSwitch) toggleSwitch.checked = true;
}

if (toggleSwitch) {
  toggleSwitch.addEventListener("change", (e) => {
    document.body.classList.toggle("dark-theme", e.target.checked);
    localStorage.setItem(
      "portfolio-theme",
      e.target.checked ? "dark" : "light",
    );
  });
}

// --- Terminal Typewriter Effect ---
const typewriterText = document.getElementById("typewriter-text");
if (typewriterText) {
  const typingSequence = [
    "> establishing_secure_connection...",
    "> decrypting_profile_data.sys...",
    "> Computer Science & Cyber Security | Networks",
  ];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function typeEffect() {
    for (let i = 0; i < typingSequence.length; i++) {
      const phrase = typingSequence[i];
      for (let j = 0; j <= phrase.length; j++) {
        typewriterText.textContent = phrase.substring(0, j);
        await sleep(Math.random() * 40 + 30);
      }
      if (i < typingSequence.length - 1) {
        await sleep(1000);
        for (let j = phrase.length; j >= 0; j--) {
          typewriterText.textContent = phrase.substring(0, j);
          await sleep(15);
        }
      }
    }
  }
  setTimeout(typeEffect, 500);
}

// --- Scroll Spy Navigation Highlight ---
const sections = document.querySelectorAll("section[id]");
const navItems = document.querySelectorAll(".nav-links a[href^='#']");

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY + 150;
  let currentSection = "";

  sections.forEach((section) => {
    if (
      scrollY >= section.offsetTop &&
      scrollY < section.offsetTop + section.offsetHeight
    ) {
      currentSection = section.getAttribute("id");
    }
  });

  navItems.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${currentSection}`,
    );
  });
});

// --- EmailJS Contact Form Logic ---
try {
  if (typeof emailjs !== "undefined") {
    emailjs.init("BU9pJODa_EOd6-gkH");
  } else {
    console.warn("EmailJS blocked by browser tracking prevention.");
  }
} catch (e) {
  console.error("EmailJS failed to load:", e);
}

const contactForm = document.getElementById("contact-form");
const submitButton = document.getElementById("submit-button");
const formStatus = document.getElementById("form-status");

if (contactForm) {
  contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const originalText = submitButton.textContent;
    submitButton.textContent = "Sending...";
    submitButton.style.opacity = "0.7";
    submitButton.disabled = true;
    formStatus.textContent = "";

    emailjs
      .sendForm("service_8hwe1ki", "template_ngqt3qt", this)
      .then(() => {
        formStatus.textContent =
          "Message sent successfully! I will get back to you soon.";
        formStatus.style.color = "#10b981";
        contactForm.reset();
      })
      .catch((error) => {
        formStatus.textContent =
          "Failed to send message. Please try again or email me directly.";
        formStatus.style.color = "#ef4444";
        console.error("EmailJS Error:", error);
      })
      .finally(() => {
        submitButton.textContent = originalText;
        submitButton.style.opacity = "1";
        submitButton.disabled = false;
        setTimeout(() => (formStatus.textContent = ""), 5000);
      });
  });
}
