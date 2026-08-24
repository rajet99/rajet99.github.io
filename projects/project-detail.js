// Project details database mapping
const PROJECTS_DATABASE = {
    "tvc-rocket": {
        title: "TVC Rocket",
        tag: "Aerospace & GNC",
        repo: "tvc-experimentation",
        image: "rocket.png",
        githubUrl: "https://github.com/rajet99/tvc-experimentation",
        prevLink: null,
        nextLink: "../inverted-pendulum/index.html"
    },
    "inverted-pendulum": {
        title: "Linear Inverted Pendulum",
        tag: "Control Theory & Embedded",
        repo: "inverted-pendulum",
        image: "balance.png",
        githubUrl: "https://github.com/rajet99/inverted-pendulum",
        prevLink: "../TVC/index.html",
        nextLink: "../dual-ratio-transmission/index.html"
    },
    "dual-ratio-transmission": {
        title: "Dual Ratio Passive-Shifting Transmission",
        tag: "Mechanical Design & Powertrain",
        localMarkdown: "README.md",
        image: "Transmission.jpg",
        folder: "dual-ratio-transmission",
        prevLink: "../inverted-pendulum/index.html",
        nextLink: "../line-following-robot/index.html"
    },
    "line-following-robot": {
        title: "Autonomous Line-Following Robot",
        tag: "Robotics & Embedded Systems",
        localMarkdown: "README.md",
        image: "ME129.jpg",
        folder: "line-following-robot",
        prevLink: "../dual-ratio-transmission/index.html",
        nextLink: "../object-tracking-webcam/index.html"
    },
    "object-tracking-webcam": {
        title: "Object Tracking Webcam System",
        tag: "Computer Vision & Software",
        localMarkdown: "README.md",
        image: "IMG_0227.jpeg",
        folder: "object-tracking-webcam",
        prevLink: "../line-following-robot/index.html",
        nextLink: null
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Establish project configuration from body attribute
    const projectId = document.body.getAttribute('data-project-id');
    let activeProject = PROJECTS_DATABASE[projectId];
    
    if (!activeProject) {
        console.error('Project configuration not found for: ' + projectId);
        return;
    }

    // Helper to resolve project ID from relative navigation links
    const getProjectIdFromLink = (link) => {
        if (!link) return null;
        for (const id in PROJECTS_DATABASE) {
            const proj = PROJECTS_DATABASE[id];
            if (link.includes(id) || 
                (proj.repo && link.includes(proj.repo)) || 
                (proj.folder && link.includes(proj.folder)) || 
                (id === 'tvc-rocket' && link.includes('TVC'))) {
                return id;
            }
        }
        return null;
    };

    // Check if running locally on file system or hosted on a web server
    const isLocal = window.location.protocol === 'file:';

    // 2. Shrink navbar on scroll
    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
        if (window.scrollY > 20) {
            navbar.classList.remove('header-large');
        } else {
            navbar.classList.add('header-large');
        }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // 3. Helper to append the current theme query parameter to relative navigation links
    const appendThemeToLinks = () => {
        let currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme !== 'dark' && currentTheme !== 'light') {
            currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // IGNORE same-page local hash links (e.g. #home, #projects) to prevent browser reload / navigation loops
            if (!href || href.startsWith('#')) {
                return;
            }
            
            // Check if it's an internal relative link (local pages, back links, etc.)
            if (href.startsWith('.') || href.startsWith('/') || href.includes('index.html') || href.includes('?theme=')) {
                // Ignore absolute links to different protocols/domains
                if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                    if (!href.includes('rajet99.github.io')) {
                        return;
                    }
                }
                
                try {
                    const hashIndex = href.indexOf('#');
                    let cleanHref = hashIndex !== -1 ? href.substring(0, hashIndex) : href;
                    let hash = hashIndex !== -1 ? href.substring(hashIndex) : '';
                    
                    // If hosted on a server (not file://), convert index.html#page hash links to clean SPA paths
                    if (!isLocal && cleanHref.includes('index.html') && hash) {
                        const targetSection = hash.replace('#', '').split('?')[0];
                        if (targetSection === 'projects') {
                            cleanHref = '../../projects';
                            hash = '';
                        } else if (targetSection === 'about') {
                            cleanHref = '../../about';
                            hash = '';
                        } else if (targetSection === 'home') {
                            cleanHref = '../../';
                            hash = '';
                        }
                    }

                    const queryIndex = cleanHref.indexOf('?');
                    if (queryIndex !== -1) {
                        const params = new URLSearchParams(cleanHref.substring(queryIndex + 1));
                        params.set('theme', currentTheme);
                        cleanHref = cleanHref.substring(0, queryIndex) + '?' + params.toString();
                    } else {
                        cleanHref = cleanHref + `?theme=${currentTheme}`;
                    }
                    
                    // Use setAttribute to write the literal path directly, avoiding browser URL resolution bugs
                    link.setAttribute('href', cleanHref + hash);
                } catch (e) {
                    console.error('Failed to append theme query to link: ' + href, e);
                }
            }
        });
    };

    // 4. Theme Toggle Setup
    const themeToggleBtn = document.getElementById('theme-toggle');
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {
            console.warn('Failed to save theme choice to localStorage.');
        }
        
        // Dynamically update the current window address URL parameter to prevent flashes on refresh
        const url = new URL(window.location.href);
        url.searchParams.set('theme', newTheme);
        window.history.replaceState({}, '', url.toString());
        
        // Push the theme down to all relative anchors
        appendThemeToLinks();
    });

    // 5. Initialize Page DOM elements to wrap the article slide within viewports
    const setupArticleSlider = () => {
        const article = document.querySelector('.project-article');
        if (article && !article.parentNode.classList.contains('project-slider-wrapper')) {
            const viewport = document.createElement('div');
            viewport.className = 'project-slider-viewport';
            
            const wrapper = document.createElement('div');
            wrapper.className = 'project-slider-wrapper';
            
            article.parentNode.insertBefore(viewport, article);
            viewport.appendChild(wrapper);
            wrapper.appendChild(article);
        }
    };
    setupArticleSlider();

    // 6. Helper function to fetch and render dynamic markdown file content (either GitHub or Local Markdown files)
    const loadProjectContent = (projConfig, containerElement, callback) => {
        let fetchUrl = '';
        if (projConfig.repo) {
            fetchUrl = `https://raw.githubusercontent.com/rajet99/${projConfig.repo}/main/README.md`;
        } else if (projConfig.localMarkdown) {
            const currentFolder = document.body.getAttribute('data-project-id');
            if (projConfig.folder && projConfig.folder !== currentFolder) {
                fetchUrl = `../${projConfig.folder}/${projConfig.localMarkdown}`;
            } else {
                fetchUrl = projConfig.localMarkdown;
            }
        }

        if (!fetchUrl) return;

        fetch(fetchUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load project details');
                }
                return response.text();
            })
            .then(markdown => {
                // Convert markdown to HTML (stripping the main repository title if present to avoid duplicate headers)
                let cleanMarkdown = markdown.replace(/^#\s+.*/m, ''); // Strips the first h1
                
                // SPLIT LOGIC
                const firstHeadingIndex = cleanMarkdown.search(/^##?\s+/m);
                
                let descriptionMarkdown = "";
                let detailsMarkdown = "";
                
                if (firstHeadingIndex !== -1) {
                    descriptionMarkdown = cleanMarkdown.substring(0, firstHeadingIndex).trim();
                    detailsMarkdown = cleanMarkdown.substring(firstHeadingIndex).trim();
                } else {
                    descriptionMarkdown = cleanMarkdown.trim();
                    detailsMarkdown = "";
                }
                
                const descContainer = containerElement.closest('.project-article').querySelector('.project-description-content');
                if (descContainer) {
                    descContainer.innerHTML = marked.parse(descriptionMarkdown);
                }
                
                const htmlContent = marked.parse(detailsMarkdown);
                containerElement.innerHTML = htmlContent;

                // DYNAMIC SECTION HIDING:
                const headings = containerElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
                let blacklistedTitles = ['requirements', 'setup', 'running', 'structure', 'usage'];
                
                headings.forEach(heading => {
                    const titleText = heading.textContent.trim().toLowerCase();
                    const shouldHide = blacklistedTitles.some(blacklisted => titleText.includes(blacklisted));
                    
                    if (shouldHide) {
                        heading.style.display = 'none';
                        let sibling = heading.nextElementSibling;
                        while (sibling && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(sibling.tagName)) {
                            sibling.style.display = 'none';
                            sibling = sibling.nextElementSibling;
                        }
                    }
                });

                // DYNAMIC VIDEO EMBEDDING:
                const links = containerElement.querySelectorAll('a');
                links.forEach(link => {
                    const url = link.href;
                    
                    // Handle GitHub user attachments
                    if (url.includes('github.com/user-attachments/assets/')) {
                        const video = document.createElement('video');
                        video.src = url;
                        video.controls = true;
                        video.style.width = '100%';
                        video.style.borderRadius = '8px';
                        video.style.marginTop = '1rem';
                        video.style.marginBottom = '1.5rem';
                        video.style.display = 'block';
                        
                        const detailsParent = link.closest('details');
                        if (detailsParent) {
                            detailsParent.parentNode.replaceChild(video, detailsParent);
                        } else {
                            link.parentNode.replaceChild(video, link);
                        }
                    } 
                    // Handle YouTube links
                    else if (url.includes('youtu.be/') || url.includes('youtube.com/watch') || url.includes('youtube.com/shorts/')) {
                        let videoId = '';
                        if (url.includes('youtu.be/')) {
                            videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
                        } else if (url.includes('youtube.com/shorts/')) {
                            videoId = url.split('youtube.com/shorts/')[1].split(/[?#]/)[0];
                        } else if (url.includes('v=')) {
                            videoId = url.split('v=')[1].split('&')[0];
                        }
                        
                        if (videoId) {
                            let elementToInsert;
                            
                            if (isLocal) {
                                const fallbackCard = document.createElement('a');
                                fallbackCard.href = url;
                                fallbackCard.target = '_blank';
                                fallbackCard.className = 'local-video-fallback';
                                fallbackCard.innerHTML = `
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.53 3.54 12 3.54 12 3.54s-7.53 0-9.388.515a3.003 3.003 0 0 0-2.11 2.108C0 8.017 0 12 0 12s0 3.983.502 5.837a3.003 3.003 0 0 2.11 2.108C4.47 20.46 12 20.46 12 20.46s7.53 0 9.388-.515a3.003 3.003 0 0 0 2.11-2.108C24 15.983 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                    <span>Watch Demonstration on YouTube</span>
                                    <span class="local-video-note">(Video embedding is disabled on local drive files)</span>
                                `;
                                elementToInsert = fallbackCard;
                            } else {
                                const iframeContainer = document.createElement('div');
                                iframeContainer.style.position = 'relative';
                                iframeContainer.style.paddingBottom = '56.25%';
                                iframeContainer.style.height = '0';
                                iframeContainer.style.overflow = 'hidden';
                                iframeContainer.style.borderRadius = '8px';
                                iframeContainer.style.marginTop = '1rem';
                                iframeContainer.style.marginBottom = '1.5rem';
                                iframeContainer.style.border = '1px solid var(--border-color)';
                                
                                const iframe = document.createElement('iframe');
                                iframe.src = `https://www.youtube.com/embed/${videoId}`;
                                iframe.frameBorder = '0';
                                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                                iframe.allowFullscreen = true;
                                iframe.style.position = 'absolute';
                                iframe.style.top = '0';
                                iframe.style.left = '0';
                                iframe.style.width = '100%';
                                iframe.style.height = '100%';
                                
                                iframeContainer.appendChild(iframe);
                                elementToInsert = iframeContainer;
                            }
                            
                            if (link.parentNode) {
                                link.parentNode.replaceChild(elementToInsert, link);
                            }
                        }
                    }
                });

                // DYNAMIC LATEX RENDERING (KaTeX auto-render):
                if (typeof renderMathInElement === 'function') {
                    renderMathInElement(document.body, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ],
                        throwOnError: false
                    });
                }
                
                appendThemeToLinks();
                if (callback) callback();
            })
            .catch(error => {
                console.error(error);
                const hasExistingContent = containerElement.children.length > 0 && !containerElement.querySelector('.loading-spinner');
                if (!hasExistingContent) {
                    containerElement.innerHTML = `
                        <p style="color: #ef4444; font-weight: bold;">Could not load details.</p>
                        <p style="color: var(--text-secondary); margin-top: 1rem;">Please visit the project page directly or check back later.</p>
                    `;
                } else {
                    if (typeof renderMathInElement === 'function') {
                        renderMathInElement(document.body, {
                            delimiters: [
                                {left: '$$', right: '$$', display: true},
                                {left: '$', right: '$', display: false},
                                {left: '\\(', right: '\\)', display: false},
                                {left: '\\[', right: '\\]', display: true}
                            ],
                            throwOnError: false
                        });
                    }
                    appendThemeToLinks();
                    if (callback) callback();
                }
            });
    };

    // 7. Load Initial Project content on startup
    const initialReadme = document.getElementById('readme-content');
    if (initialReadme) {
        const hasExistingContent = initialReadme.children.length > 0 && !initialReadme.querySelector('.loading-spinner');
        if (!hasExistingContent) {
            initialReadme.innerHTML = '<div class="loading-spinner"></div><p style="text-align: center; color: var(--text-secondary);">Loading project details...</p>';
        }
        loadProjectContent(activeProject, initialReadme, () => {
            // Generate and load Banner Image right after the Title once content is injected
            if (activeProject.image && !document.querySelector('.project-detail-banner-container')) {
                const titleHeader = document.querySelector('.project-detail-title');
                if (titleHeader) {
                    const bannerContainer = document.createElement('div');
                    bannerContainer.className = 'project-detail-banner-container';
                    
                    const bannerImg = document.createElement('img');
                    bannerImg.className = 'project-detail-banner';
                    bannerImg.alt = activeProject.title + " Thumbnail";
                    
                    bannerImg.onload = () => {
                        bannerImg.classList.add('loaded');
                    };

                    const extensions = ['png', 'jpg', 'jpeg', 'gif'];
                    let currentExtIndex = 0;

                    const tryLoadBanner = () => {
                        if (activeProject.repo) {
                            bannerImg.src = `https://raw.githubusercontent.com/rajet99/${activeProject.repo}/main/${activeProject.image.replace(/\.[a-z0-9]+$/i, '.' + extensions[currentExtIndex])}`;
                        } else if (activeProject.localMarkdown) {
                            bannerImg.src = activeProject.image;
                        }
                    };

                    bannerImg.onerror = () => {
                        currentExtIndex++;
                        if (currentExtIndex < extensions.length) {
                            tryLoadBanner();
                        } else {
                            bannerContainer.style.display = 'none';
                        }
                    };

                    bannerContainer.appendChild(bannerImg);
                    titleHeader.parentNode.insertBefore(bannerContainer, titleHeader.nextSibling);
                    tryLoadBanner();
                }
            }
        });
    }

    // 8. Generate Floating Navigation Arrows dynamically in document
    const setupNavigationArrows = () => {
        // Clear any old ones
        const oldArrows = document.querySelectorAll('.project-nav-arrow');
        oldArrows.forEach(a => a.remove());

        console.log("Setting up arrows for activeProject:", activeProject);

        // Left Arrow: Only rendered if prevLink is not null
        if (activeProject.prevLink) {
            const prevArrow = document.createElement('a');
            prevArrow.href = activeProject.prevLink;
            prevArrow.className = 'project-nav-arrow prev-project';
            prevArrow.setAttribute('aria-label', 'Previous Project');
            
            const prevId = getProjectIdFromLink(activeProject.prevLink);
            const prevTitle = prevId && PROJECTS_DATABASE[prevId] ? PROJECTS_DATABASE[prevId].title : 'Previous Project';

            prevArrow.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span class="nav-arrow-tooltip">${prevTitle}</span>
            `;
            document.body.appendChild(prevArrow);
        }
        
        // Right Arrow: Only rendered if nextLink is not null
        if (activeProject.nextLink) {
            const nextArrow = document.createElement('a');
            nextArrow.href = activeProject.nextLink;
            nextArrow.className = 'project-nav-arrow next-project';
            nextArrow.setAttribute('aria-label', 'Next Project');
            
            const nextId = getProjectIdFromLink(activeProject.nextLink);
            const nextTitle = nextId && PROJECTS_DATABASE[nextId] ? PROJECTS_DATABASE[nextId].title : 'Next Project';

            nextArrow.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <span class="nav-arrow-tooltip">${nextTitle}</span>
            `;
            document.body.appendChild(nextArrow);
        }
    };
    setupNavigationArrows();

    // 9. Horizontal Slide transition between different projects
    let isTransitioning = false;
    
    const slideToProject = (direction, targetId, updateUrl = true) => {
        if (isTransitioning) return;
        const targetProj = PROJECTS_DATABASE[targetId];
        if (!targetProj) return;

        console.log(`slideToProject: direction=${direction}, targetId=${targetId}, updateUrl=${updateUrl}`);
        isTransitioning = true;

        // Fetch the target index.html to perfectly preserve all custom multi-card layouts (Notes, Backgrounds, etc)
        let fetchUrl = direction === 'next' ? activeProject.nextLink : activeProject.prevLink;
        // Strip any hash parameters for the fetch
        if (fetchUrl) {
            fetchUrl = fetchUrl.split('#')[0].split('?')[0];
        }

        fetch(fetchUrl)
            .then(res => res.text())
            .then(htmlText => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                
                const fetchedArticle = doc.querySelector('.project-article');
                if (!fetchedArticle) throw new Error('Could not find .project-article in target html');

                const nextArticle = document.createElement('article');
                nextArticle.className = 'project-article';
                nextArticle.innerHTML = fetchedArticle.innerHTML;
                
                // Fire any script-based initialization for the new content (like KaTeX, dynamic Markdown for GitHub repos)
                // For GitHub repos, the readme-content might be empty, so we should call loadProjectContent if needed.
                const nextContentContainer = nextArticle.querySelector('.project-detail-content#readme-content');
                if (nextContentContainer) {
                    // Check if the container has real content (ignoring HTML comments and whitespace)
                    const hasRealContent = nextContentContainer.children.length > 0;
                    if (!hasRealContent) {
                        nextContentContainer.innerHTML = '<div class="loading-spinner"></div><p style="text-align: center; color: var(--text-secondary);">Loading project details...</p>';
                        loadProjectContent(targetProj, nextContentContainer);
                    }
                }

                // If images haven't loaded yet, we can attach onload handlers to remove placeholder styles if needed
                const nextBannerImg = nextArticle.querySelector('.project-detail-banner');
                if (nextBannerImg) {
                    if (nextBannerImg.complete) {
                        nextBannerImg.classList.add('loaded');
                    } else {
                        nextBannerImg.onload = () => nextBannerImg.classList.add('loaded');
                    }
                }

                const sliderWrapper = document.querySelector('.project-slider-wrapper');
                const activeArticle = sliderWrapper.querySelector('.project-article');
                
                sliderWrapper.style.transition = 'none';

                if (direction === 'next') {
                    sliderWrapper.appendChild(nextArticle);
                    sliderWrapper.offsetHeight; // force reflow
                    sliderWrapper.style.transition = 'transform var(--transition-speed) cubic-bezier(0.76, 0, 0.24, 1)';
                    sliderWrapper.style.transform = 'translateX(-100%)';
                } else {
                    sliderWrapper.insertBefore(nextArticle, activeArticle);
                    sliderWrapper.style.transform = 'translateX(-100%)';
                    sliderWrapper.offsetHeight; // force reflow
                    sliderWrapper.style.transition = 'transform var(--transition-speed) cubic-bezier(0.76, 0, 0.24, 1)';
                    sliderWrapper.style.transform = 'translateX(0)';
                }

                // Update URL bar path with history pushState
                if (updateUrl && !isLocal) {
                    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    const targetUrl = direction === 'next' ? activeProject.nextLink : activeProject.prevLink;
                    if (targetUrl) {
                        const hashIndex = targetUrl.indexOf('#');
                        let cleanUrl = hashIndex !== -1 ? targetUrl.substring(0, hashIndex) : targetUrl;
                        const hash = hashIndex !== -1 ? targetUrl.substring(hashIndex) : '';
                        
                        const finalUrl = `${cleanUrl}?theme=${document.documentElement.getAttribute('data-theme') || 'light'}${hash}`;
                        history.pushState(null, '', finalUrl);
                    }
                }

                document.title = `${targetProj.title} - Rajat Bidarkota`;

                let transitionCleared = false;
                const onTransitionEnd = (e) => {
                    if (e && e.propertyName !== 'transform') return;
                    if (transitionCleared) return;
                    transitionCleared = true;

                    sliderWrapper.removeEventListener('transitionend', onTransitionEnd);
                    sliderWrapper.removeChild(activeArticle);
                    
                    sliderWrapper.style.transition = 'none';
                    sliderWrapper.style.transform = 'translateX(0)';
                    
                    document.body.setAttribute('data-project-id', targetId);
                    activeProject = PROJECTS_DATABASE[targetId];
                    
                    setupNavigationArrows();
                    appendThemeToLinks();
                    isTransitioning = false;
                    
                    // Re-render math if KaTeX is present
                    if (window.renderMathInElement) {
                        renderMathInElement(nextArticle, {
                            delimiters: [
                                {left: '', right: '', display: true},
                                {left: '$', right: '$', display: false}
                            ],
                            throwOnError: false
                        });
                    }
                };

                sliderWrapper.addEventListener('transitionend', onTransitionEnd);
                setTimeout(() => {
                    if (!transitionCleared) {
                        onTransitionEnd(null);
                    }
                }, 450);
            })
            .catch(err => {
                console.error("Failed to load project HTML:", err);
                isTransitioning = false;
            });
    };

    // Intercept click listener on navigation arrows to trigger slide animations
    document.addEventListener('click', (e) => {
        const arrow = e.target.closest('.project-nav-arrow');
        if (!arrow) return;
        
        if (isLocal) {
            return;
        }
        
        e.preventDefault();
        
        const isNext = arrow.classList.contains('next-project');
        const direction = isNext ? 'next' : 'prev';
        
        const currentId = document.body.getAttribute('data-project-id');
        const currentProj = PROJECTS_DATABASE[currentId];
        
        if (currentProj) {
            const targetLink = isNext ? currentProj.nextLink : currentProj.prevLink;
            if (!targetLink) return;
            
            const targetId = getProjectIdFromLink(targetLink);
            if (targetId) {
                slideToProject(direction, targetId);
            }
        }
    });

    // Handle browser back/forward buttons during project details slide sessions
    window.addEventListener('popstate', () => {
        if (isLocal) return;

        const path = window.location.pathname;
        const targetId = getProjectIdFromLink(path);
        const currentId = document.body.getAttribute('data-project-id');
        
        if (targetId && targetId !== currentId && PROJECTS_DATABASE[targetId]) {
            const keys = Object.keys(PROJECTS_DATABASE);
            const direction = keys.indexOf(targetId) < keys.indexOf(currentId) ? 'prev' : 'next';
            slideToProject(direction, targetId, false);
        }
    });

    // Run initial link theme updates
    appendThemeToLinks();
});
