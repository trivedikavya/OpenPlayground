// ===============================
// OpenPlayground - Main JavaScript
// ===============================

import { ProjectVisibilityEngine } from "./core/projectVisibilityEngine.js";

// ===============================
// Theme Toggle
// ===============================
const toggleBtn = document.getElementById("toggle-mode-btn");
const themeIcon = document.getElementById("theme-icon");
const html = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem("theme") || "light";
html.setAttribute("data-theme", savedTheme);
updateThemeIcon(savedTheme);

if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        const newTheme = html.getAttribute("data-theme") === "light" ? "dark" : "light";
        html.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcon(newTheme);

        // Add shake animation
        toggleBtn.classList.add("shake");
        setTimeout(() => toggleBtn.classList.remove("shake"), 500);
    });
}

function updateThemeIcon(theme) {
    if (!themeIcon) return;
    if (theme === "dark") {
        themeIcon.className = "ri-moon-fill";
    } else {
        themeIcon.className = "ri-sun-line";
    }
}

// ===============================
// Scroll to Top
// ===============================
const scrollBtn = document.getElementById("scrollToTopBtn");

window.addEventListener("scroll", () => {
    if (scrollBtn) {
        scrollBtn.classList.toggle("show", window.scrollY > 300);
    }
});

if (scrollBtn) {
    scrollBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// ===============================
// Mobile Navbar
// ===============================
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        const icon = navToggle.querySelector("i");
        if (navLinks.classList.contains("active")) {
            icon.className = "ri-close-line";
        } else {
            icon.className = "ri-menu-3-line";
        }
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            navToggle.querySelector("i").className = "ri-menu-3-line";
        });
    });
}

// ===============================
// Projects Logic
// ===============================
const itemsPerPage = 9;
let currentPage = 1;
let currentCategory = "all";
let currentSort = "default";
let allProjectsData = [];
let visibilityEngine = null;

// DOM Elements
const searchInput = document.getElementById("project-search");
const sortSelect = document.getElementById("project-sort");
const filterBtns = document.querySelectorAll(".filter-btn");
const clearBtn = document.getElementById("search-clear");
const projectsContainer = document.querySelector(".projects-container");
const paginationContainer = document.getElementById("pagination-controls");

// --- Event Listeners ---

// 1. Search
if (searchInput) {
    searchInput.addEventListener("input", () => {
        if (visibilityEngine) {
            visibilityEngine.setSearchQuery(searchInput.value);
        }
        currentPage = 1;
        renderProjects();
    });
}

// 2. Clear Search
if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        if (searchInput) {
            searchInput.value = "";
            if (visibilityEngine) visibilityEngine.setSearchQuery("");
        }
        // Reset filters if needed, or just clear search text
        renderProjects();
    });
}

// 3. Sort
if (sortSelect) {
    sortSelect.addEventListener("change", () => {
        currentSort = sortSelect.value;
        currentPage = 1;
        renderProjects();
    });
}

// 4. Category Filters
filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.filter;
        currentPage = 1;
        renderProjects();
    });
});

// --- Core Functions ---

// Fetch and Initialize Projects
async function fetchProjects() {
    try {
        const response = await fetch("./projects.json");
        const data = await response.json();
        allProjectsData = data;

        // Update project count in hero
        const projectCount = document.getElementById("project-count");
        if (projectCount) {
            projectCount.textContent = `${data.length}+`;
        }

        // Initialize Visibility Engine
        const projectMetadata = data.map(project => ({
            id: project.title,
            title: project.title,
            category: project.category,
            description: project.description || ""
        }));

        visibilityEngine = new ProjectVisibilityEngine(projectMetadata);

        updateCategoryCounts();
        renderProjects();
    } catch (error) {
        console.error("Error loading projects:", error);
        if (projectsContainer) {
            projectsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to load projects</h3>
                    <p>Please check your internet connection or try refreshing.</p>
                </div>
            `;
        }
    }
}

// Update Filter Button Counts
function updateCategoryCounts() {
    if (allProjectsData.length === 0) return;

    const counts = {};
    allProjectsData.forEach(project => {
        // Normalize category to lowercase to match buttons
        const cat = project.category.toLowerCase();
        counts[cat] = (counts[cat] || 0) + 1;
    });

    filterBtns.forEach(btn => {
        const cat = btn.dataset.filter;
        if (cat === "all") {
            btn.innerText = `All (${allProjectsData.length})`;
        } else {
            // Capitalize first letter
            const label = cat.charAt(0).toUpperCase() + cat.slice(1);
            btn.innerText = `${label} (${counts[cat] || 0})`;
        }
    });
}

// Render Projects to DOM
function renderProjects() {
    if (!projectsContainer) return;

    let filteredProjects = [...allProjectsData];

    // 1. Search Filtering (via Engine)
    if (visibilityEngine && searchInput && searchInput.value.trim() !== "") {
        const visibleProjects = visibilityEngine.getFilteredProjects();
        const visibleTitles = new Set(visibleProjects.map(p => p.title));
        
        filteredProjects = filteredProjects.filter(project =>
            visibleTitles.has(project.title)
        );
    }

    // 2. Category Filtering
    if (currentCategory !== "all") {
        filteredProjects = filteredProjects.filter(
            (project) => project.category.toLowerCase() === currentCategory.toLowerCase()
        );
    }

    // 3. Sorting
    switch (currentSort) {
        case "az":
            filteredProjects.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case "za":
            filteredProjects.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case "newest":
            // Assuming the JSON order is newest-first or added sequentially. 
            // If you have date fields, use those. Otherwise, reverse index.
            // For now, we'll just reverse the array if it's "newest"
            // (or if default is newest, then "oldest" would be reverse).
            // Let's assume default JSON is random/mixed and "Newest" means bottom of list? 
            // Usually JSON lists are top=newest. Let's keep specific logic simple:
            // If your JSON is newest-at-top, default is fine.
            break; 
    }

    // 4. Pagination
    const totalItems = filteredProjects.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredProjects.slice(start, start + itemsPerPage);

    projectsContainer.innerHTML = "";

    // Empty State
    if (paginatedItems.length === 0) {
        document.getElementById("empty-state").style.display = "block";
        document.querySelector(".projects-show-more").style.display = "none";
        renderPagination(0);
        return;
    } else {
        document.getElementById("empty-state").style.display = "none";
    }

    // Render Cards
    paginatedItems.forEach((project, index) => {
        const card = document.createElement("a");
        card.href = project.link;
        card.className = "card";
        card.setAttribute("data-category", project.category);

        // Handle cover styles (support both Class and Inline Style)
        let coverAttr = "";
        if (project.coverClass) {
            coverAttr = `class="card-cover ${project.coverClass}"`;
        } else if (project.coverStyle) {
            coverAttr = `class="card-cover" style="${project.coverStyle}"`;
        } else {
            coverAttr = `class="card-cover"`; // Default fallback
        }

        const techStackHtml = project.tech.map((t) => `<span>${t}</span>`).join("");

        // Bookmark Check
        const isBookmarked = window.bookmarksManager && window.bookmarksManager.isBookmarked(project.title);
        const bookmarkClass = isBookmarked ? 'bookmarked' : '';
        const bookmarkIcon = isBookmarked ? 'ri-bookmark-fill' : 'ri-bookmark-line';

        card.innerHTML = `
            <button class="bookmark-btn ${bookmarkClass}" data-project-title="${escapeHtml(project.title)}" aria-label="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}">
                <i class="${bookmarkIcon}"></i>
            </button>
            <div ${coverAttr}><i class="${project.icon}"></i></div>
            <div class="card-content">
                <div class="card-header-flex">
                    <h3 class="card-heading">${project.title}</h3>
                    <span class="category-tag">${capitalize(project.category)}</span>
                </div>
                <p class="card-description">${project.description}</p>
                <div class="card-tech">${techStackHtml}</div>
            </div>
        `;

        // GitHub Link (if exists)
        if (project.github) {
            const githubBtn = document.createElement("a");
            githubBtn.href = project.github;
            githubBtn.target = "_blank";
            githubBtn.rel = "noopener noreferrer";
            githubBtn.className = "github-link";
            githubBtn.innerHTML = `<i class="ri-github-fill"></i>`;
            githubBtn.addEventListener("click", e => e.stopPropagation());
            card.style.position = "relative";
            card.appendChild(githubBtn);
        }

        // Bookmark Click Event
        const bookmarkBtn = card.querySelector('.bookmark-btn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBookmarkClick(bookmarkBtn, project);
            });
        }

        // Stagger Animation
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        projectsContainer.appendChild(card);

        setTimeout(() => {
            card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }, index * 50);
    });

    renderPagination(totalPages);
}

// --- Helper Functions ---

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function handleBookmarkClick(btn, project) {
    if (!window.bookmarksManager) return;
    
    const isNowBookmarked = window.bookmarksManager.toggleBookmark(project);
    const icon = btn.querySelector('i');
    
    btn.classList.toggle('bookmarked', isNowBookmarked);
    icon.className = isNowBookmarked ? 'ri-bookmark-fill' : 'ri-bookmark-line';
    btn.setAttribute('aria-label', isNowBookmarked ? 'Remove bookmark' : 'Add bookmark');
    
    btn.classList.add('animate');
    setTimeout(() => btn.classList.remove('animate'), 300);
    
    showBookmarkToast(isNowBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks');
}

function showBookmarkToast(message) {
    const existingToast = document.querySelector('.bookmark-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'bookmark-toast';
    toast.innerHTML = `<i class="ri-bookmark-fill"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// --- Pagination ---

function renderPagination(totalPages) {
    if (!paginationContainer) return;

    paginationContainer.innerHTML = "";
    if (totalPages <= 1) return;

    const createBtn = (label, disabled, onClick, isActive = false) => {
        const btn = document.createElement("button");
        btn.className = `pagination-btn${isActive ? " active" : ""}`;
        btn.innerHTML = label;
        btn.disabled = disabled;
        btn.onclick = onClick;
        return btn;
    };

    // Prev Button
    paginationContainer.appendChild(
        createBtn('<i class="ri-arrow-left-s-line"></i>', currentPage === 1, () => {
            currentPage--;
            renderProjects();
            scrollToProjects();
        })
    );

    // Page Numbers Logic
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        paginationContainer.appendChild(createBtn("1", false, () => {
            currentPage = 1;
            renderProjects();
            scrollToProjects();
        }));
        if (startPage > 2) {
            const ellipsis = document.createElement("span");
            ellipsis.className = "pagination-btn";
            ellipsis.textContent = "...";
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationContainer.appendChild(createBtn(i, false, () => {
            currentPage = i;
            renderProjects();
            scrollToProjects();
        }, i === currentPage));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement("span");
            ellipsis.className = "pagination-btn";
            ellipsis.textContent = "...";
            paginationContainer.appendChild(ellipsis);
        }
        paginationContainer.appendChild(createBtn(totalPages, false, () => {
            currentPage = totalPages;
            renderProjects();
            scrollToProjects();
        }));
    }

    // Next Button
    paginationContainer.appendChild(
        createBtn('<i class="ri-arrow-right-s-line"></i>', currentPage === totalPages, () => {
            currentPage++;
            renderProjects();
            scrollToProjects();
        })
    );
}

function scrollToProjects() {
    const projectsSection = document.getElementById("projects");
    if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// ===============================
// Contributors Logic
// ===============================
const contributorsGrid = document.getElementById("contributors-grid");

async function fetchContributors() {
    try {
        // Fetch from GitHub API
        const response = await fetch(
            "https://api.github.com/repos/YadavAkhileshh/OpenPlayground/contributors"
        );
        
        if (!response.ok) throw new Error("Failed to fetch contributors");
        
        const contributors = await response.json();

        // 1. Update the Hero Section Counter
        const contributorCount = document.getElementById("contributor-count");
        if (contributorCount) {
            contributorCount.textContent = `${contributors.length}+`;
        }

        // 2. Render Grid (only if on contributors page or section exists)
        if (contributorsGrid) {
            contributorsGrid.innerHTML = "";
            contributors.forEach((contributor, index) => {
                const card = document.createElement("div");
                card.className = "contributor-card";
                const isDeveloper = contributor.contributions > 50; // Custom logic
                const badgeHTML = isDeveloper
                    ? `<span class="contributor-badge developer-badge"><i class="ri-code-s-slash-line"></i> Developer</span>`
                    : '';

                card.innerHTML = `
                    <img src="${contributor.avatar_url}" alt="${contributor.login}" class="contributor-avatar" loading="lazy">
                    <div class="contributor-info">
                        <h3 class="contributor-name">${contributor.login}</h3>
                        <div class="contributor-stats">
                            <span class="contributor-contributions">
                                <i class="ri-git-commit-line"></i> ${contributor.contributions} contributions
                            </span>
                            ${badgeHTML}
                        </div>
                    </div>
                    <a href="${contributor.html_url}" target="_blank" rel="noopener noreferrer" class="contributor-github-link" aria-label="View ${contributor.login} on GitHub">
                        <i class="ri-github-fill"></i>
                    </a>
                `;

                // Stagger Animation
                card.style.opacity = "0";
                card.style.transform = "translateY(20px)";
                contributorsGrid.appendChild(card);
                setTimeout(() => {
                    card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                    card.style.opacity = "1";
                    card.style.transform = "translateY(0)";
                }, index * 30);
            });
        }
    } catch (error) {
        console.error("Error fetching contributors:", error);
    }
}

// ===============================
// Animations & Navbar Scroll
// ===============================

const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function setupAnimations() {
    // We setup the observer only after components are loaded
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => {
        observer.observe(el);
    });
}

// ===============================
// Initialization
// ===============================

// Logic to wait for components to load
let componentsLoaded = 0;
const totalComponents = 6; // header, hero, projects, contribute, footer, chatbot

document.addEventListener('componentLoaded', () => {
    componentsLoaded++;
    if (componentsLoaded === totalComponents) {
        initializeApp();
    }
});

// Fallback if events fail
setTimeout(() => {
    if (componentsLoaded < totalComponents) {
        console.log('Initializing app via fallback timeout...');
        initializeApp();
    }
}, 3000);

function initializeApp() {
    // 1. Fetch & Render Projects
    fetchProjects();

    // 2. Fetch & Render Contributors (Fixes Hero Stats)
    fetchContributors();

    // 3. Setup Animations (Fixes Hero Animations)
    setupAnimations();

    console.log('🚀 OpenPlayground app initialized successfully!');
}

console.log(
    "%c🚀 Want to contribute? https://github.com/YadavAkhileshh/OpenPlayground",
    "color: #6366f1; font-size: 14px; font-weight: bold;"
);