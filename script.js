const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const revealElements = document.querySelectorAll(".reveal");
const projectsGrid = document.querySelector(".projects-grid");
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
  if (!projectsGrid) {
    return;
  }

  const githubUser = projectsGrid.dataset.githubUser;
  if (!githubUser) {
    projectsGrid.innerHTML =
      '<p class="projects-status">No GitHub user configured for this section.</p>';
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(githubUser)}/repos?sort=pushed&direction=desc&per_page=6`,
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
      .slice(0, 3);

    if (!recentProjects.length) {
      projectsGrid.innerHTML =
        '<p class="projects-status">No recent public GitHub projects found.</p>';
      return;
    }

    projectsGrid.innerHTML = recentProjects
      .map((repo) => {
        const description = repo.description || "No description provided yet.";
        const language = repo.language || "Code";
        const updatedAt = repo.pushed_at
          ? new Date(repo.pushed_at).toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })
          : "Recently updated";
        const liveLink = repo.homepage ? repo.homepage.trim() : "";

        return `
          <article class="card project-card">
            <div class="project-card__top">
              <h3 class="project-card__title">${repo.name}</h3>
              <span class="project-card__badge">${language}</span>
            </div>
            <p>${description}</p>
            <div class="project-card__meta">
              <span>Updated ${updatedAt}</span>
              <span>${repo.stargazers_count} stars</span>
            </div>
            <div class="project-card__actions">
              <a class="project-link" href="${repo.html_url}" target="_blank" rel="noopener">View Repo</a>
              ${
                liveLink
                  ? `<a class="project-link" href="${liveLink}" target="_blank" rel="noopener">Live Demo</a>`
                  : ""
              }
            </div>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    projectsGrid.innerHTML =
      '<p class="projects-status">Could not load GitHub projects right now. Please try again later.</p>';
  }
}

loadGitHubProjects();
