const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const revealElements = document.querySelectorAll(".reveal");
const projectsList = document.querySelector("#project-list");
const ignoredRepositoryNames = new Set(["Lama-Raj", "Lama-Raj.github.io"]);

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

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 },
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

async function loadGitHubProjects() {
  if (!projectsList) {
    return;
  }

  // 1. Check if we already have the projects saved in the browser
  const cachedProjects = sessionStorage.getItem("github_portfolio_cache");
  if (cachedProjects) {
    projectsList.innerHTML = cachedProjects;
    return; // Stop here, no need to call the API!
  }

  const githubUser = projectsList.dataset.githubUser;
  if (!githubUser) {
    projectsList.innerHTML =
      '<p class="projects-status">No GitHub user configured for this section.</p>';
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(githubUser)}/repos?sort=pushed&direction=desc&per_page=10`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub request failed with status ${response.status}`);
    }

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
        if (!repo.languages_url) {
          return { ...repo, languages: [] };
        }

        try {
          const languageResponse = await fetch(repo.languages_url, {
            headers: {
              Accept: "application/vnd.github+json",
            },
          });

          if (!languageResponse.ok) {
            return { ...repo, languages: repo.language ? [repo.language] : [] };
          }

          const languageMap = await languageResponse.json();
          const languages = Object.entries(languageMap)
            .sort((first, second) => second[1] - first[1])
            .map(([language]) => language)
            .slice(0, 3);

          return {
            ...repo,
            languages: languages.length
              ? languages
              : repo.language
                ? [repo.language]
                : [],
          };
        } catch (error) {
          return { ...repo, languages: repo.language ? [repo.language] : [] };
        }
      }),
    );

    if (!repositoriesWithLanguages.length) {
      projectsList.innerHTML =
        '<p class="projects-status">No recent public GitHub projects found.</p>';
      return;
    }

    // 2. Generate the HTML string
    const finalHTML = repositoriesWithLanguages
      .map((repo) => {
        const description = repo.description || "No description provided yet.";
        const updatedAt = repo.pushed_at
          ? new Date(repo.pushed_at).toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })
          : "Recently updated";

        return `
          <article class="project-row">
            <div class="project-info">
              <h3>${repo.name}</h3>
              <p>${description}</p>
              <div class="project-langs">
                ${(repo.languages || [repo.language || "Code"])
                  .filter(Boolean)
                  .map(
                    (language) => `<span class="lang-tag">${language}</span>`,
                  )
                  .join("")}
              </div>
            </div>
            <div class="project-meta">
              <span class="project-date">Updated: ${updatedAt}</span>
              <a class="link-text" href="${repo.html_url}" target="_blank" rel="noopener">View Source &rarr;</a>
            </div>
          </article>
        `;
      })
      .join("");

    // 3. Put the HTML on the page and save it to the cache
    projectsList.innerHTML = finalHTML;
    sessionStorage.setItem("github_portfolio_cache", finalHTML);
  } catch (error) {
    // 4. Log the actual error to the console so you can see it!
    console.error("GitHub API Error:", error);
    projectsList.innerHTML =
      '<p class="projects-status">Could not load GitHub projects right now. Please try again later.</p>';
  }
}

loadGitHubProjects();
// --- Background Scroll Fade Effect ---
window.addEventListener("scroll", () => {
  const scrollPosition = window.scrollY;

  // How many pixels the user needs to scroll before the image is completely gone
  const fadeDistance = 700;

  // The starting opacity of your background (matches the 0.6 we set earlier)
  const maxOpacity = 0.6;

  // Calculate the new opacity: goes from 0.6 down to 0
  let newOpacity = maxOpacity - (scrollPosition / fadeDistance) * maxOpacity;

  // Prevent the opacity from dropping below 0
  if (newOpacity < 0) {
    newOpacity = 0;
  }

  // Update the CSS variable in real-time
  document.documentElement.style.setProperty(
    "--bg-opacity",
    newOpacity.toFixed(3),
  );
});
// --- Dark Mode Logic (Toggle Switch) ---
const toggleSwitch = document.querySelector(
  '.theme-switch input[type="checkbox"]',
);
const body = document.body;

// 1. Check if the user previously saved a dark theme preference
const currentTheme = localStorage.getItem("portfolio-theme");
if (currentTheme === "dark") {
  body.classList.add("dark-theme");
  toggleSwitch.checked = true; // Make sure the switch is in the "on" position
}

// 2. Listen for the switch being toggled
toggleSwitch.addEventListener("change", function (e) {
  if (e.target.checked) {
    // Switch is ON -> Turn on Dark Mode
    body.classList.add("dark-theme");
    localStorage.setItem("portfolio-theme", "dark");
  } else {
    // Switch is OFF -> Turn on Light Mode
    body.classList.remove("dark-theme");
    localStorage.setItem("portfolio-theme", "light");
  }
});
// --- Terminal Typewriter Effect ---
const typewriterText = document.getElementById("typewriter-text");

if (typewriterText) {
  // The sequence of commands to type
  const typingSequence = [
    "> establishing_secure_connection...",
    "> decrypting_profile_data.sys...",
    "> Computer Science & Cyber Security | Networks",
  ];

  async function typeEffect() {
    // Helper function to create pauses
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < typingSequence.length; i++) {
      const phrase = typingSequence[i];

      // Type out the phrase character by character
      for (let j = 0; j <= phrase.length; j++) {
        typewriterText.textContent = phrase.substring(0, j);

        // Randomize typing speed slightly for realism (30ms to 70ms)
        const typeSpeed = Math.random() * 40 + 30;
        await sleep(typeSpeed);
      }

      // If it's NOT the last phrase, wait a moment, then delete it
      if (i < typingSequence.length - 1) {
        await sleep(1000); // Wait 1 second before deleting

        for (let j = phrase.length; j >= 0; j--) {
          typewriterText.textContent = phrase.substring(0, j);
          await sleep(15); // Deletion is usually faster than typing
        }
      }
    }
  }

  // Start the typing effect 500ms after the page loads
  setTimeout(typeEffect, 500);
}
