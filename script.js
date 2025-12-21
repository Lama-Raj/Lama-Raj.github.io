const username = "Lama-Raj";
const projectContainer = document.getElementById('project-list');

// OVERRIDE LIST: Use Resume descriptions for specific repos
const customData = {
    "Python-game": {
        title: "Battleship Game Logic",
        description: "Developed an interactive Battleship game in Python using OOP concepts. Implemented complex game logic, unit testing with `unittest`, and file processing for score tracking.",
        tags: ["Python", "OOP", "Unit Testing"]
    },
    "HospitalManagementSystem": {
        title: "Hospital Management System",
        description: "Engineered a responsive web app using ASP.NET and SQL Server to streamline patient reporting. Reduced manual paperwork by digitizing appointment processes.",
        tags: ["C#", "ASP.NET", "SQL Server"]
    },
    "Personal-Health-Buddy": { 
        title: "Personal Health Buddy (Android)",
        description: "Developed an Android health app using Kotlin and Jetpack Compose. Integrated Firebase for secure auth and data, featuring an AI-powered health chatbot.",
        tags: ["Kotlin", "Firebase", "AI Integration"]
    }
};

async function getRepos() {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        projectContainer.innerHTML = '';
        
        // 1. FILTER: Exclude the portfolio repo and the profile repo
        const filteredData = data.filter(repo => 
            repo.name !== "Lama-Raj.github.io" && 
            repo.name !== "Lama-Raj"
        );

        // 2. SLICE: Take the top 5 from the REMAINING list
        const recentRepos = filteredData.slice(0, 5);

        recentRepos.forEach(repo => {
            const custom = customData[repo.name];
            const displayTitle = custom ? custom.title : repo.name;
            const displayDesc = custom ? custom.description : (repo.description || "No description provided.");
            
            let tagsHtml = '';
            if (custom && custom.tags) {
                tagsHtml = custom.tags.map(tag => `<span class="lang-tag">${tag}</span>`).join('');
            } else {
                tagsHtml = `<span class="lang-tag">${repo.language || 'Code'}</span>`;
            }

            const date = new Date(repo.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });

            const row = document.createElement('div');
            row.classList.add('project-row');

            // --- HTML STRUCTURE ---
            // Left Side: Info. Right Side: Date & Link stacked.
            row.innerHTML = `
                <div class="project-info">
                    <h3>${displayTitle}</h3>
                    <p>${displayDesc}</p>
                    <div>${tagsHtml}</div>
                </div>

                <div class="project-meta">
                    <span class="project-date">Updated: ${date}</span>
                    <a href="${repo.html_url}" target="_blank" class="link-text">
                        View Source <i class="fas fa-arrow-right" style="font-size: 0.8em;"></i>
                    </a>
                </div>
            `;
            
            projectContainer.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        projectContainer.innerHTML = `<p>Error loading projects. Please check GitHub connection.</p>`;
    }
}

// Run the function
getRepos();