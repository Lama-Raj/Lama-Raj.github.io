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

    projectsList.innerHTML = repositoriesWithLanguages
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
  } catch (error) {
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
