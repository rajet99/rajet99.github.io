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
                    const hash = hashIndex !== -1 ? href.substring(hashIndex) : '';
                    
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
            fetchUrl = projConfig.localMarkdown;
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
                let cleanMarkdown = markdown.replace(/^#\s+.*$/m, ''); // Strips the first h1
                
                const htmlContent = marked.parse(cleanMarkdown);
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
                    else if (url.includes('youtu.be/') || url.includes('youtube.com/watch')) {
                        let videoId = '';
                        if (url.includes('youtu.be/')) {
                            videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
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
                                        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.53 3.54 12 3.54 12 3.54s-7.53 0-9.388.515a3.003 3.003 0 0 0-2.11 2.108C0 8.017 0 12 0 12s0 3.983.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.47 20.46 12 20.46 12 20.46s7.53 0 9.388-.515a3.003 3.003 0 0 0 2.11-2.108C24 15.983 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
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
                    renderMathInElement(containerElement, {
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
                containerElement.innerHTML = `
                    <p style="color: #ef4444; font-weight: bold;">Could not load details.</p>
                    <p style="color: var(--text-secondary); margin-top: 1rem;">Please visit the project page directly or check back later.</p>
                `;
            });
    };

    // 7. Load Initial Project content on startup
    const initialReadme = document.getElementById('readme-content');
    if (initialReadme) {
        initialReadme.innerHTML = '<div class="loading-spinner"></div><p style="text-align: center; color: var(--text-secondary);">Loading project details...</p>';
        loadProjectContent(activeProject, initialReadme, () => {
            // Generate and load Banner Image right after the Title once content is injected
            const titleHeader = document.querySelector('.project-detail-title');
            if (titleHeader && !document.querySelector('.project-detail-banner-container')) {
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
        });
    }

    // 8. Generate Floating Navigation Arrows dynamically in document
    const setupNavigationArrows = () => {
        // Clear any old ones
        const oldArrows = document.querySelectorAll('.project-nav-arrow');
        oldArrows.forEach(a => a.remove());

        console.log("Setting up arrows for activeProject:", activeProject);

        // Left Arrow: Only rendered if prevLink is not null (Disables looping at the start)
        if (activeProject.prevLink) {
            const prevArrow = document.createElement('a');
            prevArrow.href = activeProject.prevLink;
            prevArrow.className = 'project-nav-arrow prev-project';
            prevArrow.setAttribute('aria-label', 'Previous Project');
            
            const prevId = activeProject.prevLink.includes('TVC') ? 'tvc-rocket' : 'inverted-pendulum';
            const prevTitle = PROJECTS_DATABASE[prevId] ? PROJECTS_DATABASE[prevId].title : 'Previous Project';

            prevArrow.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span class="nav-arrow-tooltip">${prevTitle}</span>
            `;
            document.body.appendChild(prevArrow);
        }
        
        // Right Arrow: Only rendered if nextLink is not null (Disables looping at the end)
        if (activeProject.nextLink) {
            const nextArrow = document.createElement('a');
            nextArrow.href = activeProject.nextLink;
            nextArrow.className = 'project-nav-arrow next-project';
            nextArrow.setAttribute('aria-label', 'Next Project');
            
            const nextId = activeProject.nextLink.includes('TVC') ? 'tvc-rocket' : 'inverted-pendulum';
            const nextTitle = PROJECTS_DATABASE[nextId] ? PROJECTS_DATABASE[nextId].title : 'Next Project';

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

        // Create new article elements to hold sliding screen content
        const nextArticle = document.createElement('article');
        nextArticle.className = 'project-article';
        
        nextArticle.innerHTML = `
            <span class="project-tag">${targetProj.tag}</span>
            <h1 class="project-detail-title">
                ${targetProj.title}
                <a href="${targetProj.githubUrl}" target="_blank" rel="noopener noreferrer" class="title-github-link" aria-label="GitHub Repository">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                </a>
            </h1>
            <div class="project-detail-banner-container">
                <img class="project-detail-banner" alt="${targetProj.title} Thumbnail">
            </div>
            <div class="project-detail-content" id="readme-content-${targetId}">
                <div class="loading-spinner"></div>
                <p style="text-align: center; color: var(--text-secondary);">Loading project details...</p>
            </div>
        `;

        // Render banner image with fallback matching extensions
        const nextBannerImg = nextArticle.querySelector('.project-detail-banner');
        const nextBannerContainer = nextArticle.querySelector('.project-detail-banner-container');
        nextBannerImg.onload = () => {
            nextBannerImg.classList.add('loaded');
        };
        const extensions = ['png', 'jpg', 'jpeg', 'gif'];
        let currentExtIndex = 0;
        const tryLoadNextBanner = () => {
            if (targetProj.repo) {
                nextBannerImg.src = `https://raw.githubusercontent.com/rajet99/${targetProj.repo}/main/${targetProj.image.replace(/\.[a-z0-9]+$/i, '.' + extensions[currentExtIndex])}`;
            } else if (targetProj.localMarkdown) {
                nextBannerImg.src = targetProj.image;
            }
        };
        nextBannerImg.onerror = () => {
            currentExtIndex++;
            if (currentExtIndex < extensions.length) {
                tryLoadNextBanner();
            } else {
                nextBannerContainer.style.display = 'none';
            }
        };
        tryLoadNextBanner();

        // Start loading dynamic readme content
        const nextContentContainer = nextArticle.querySelector('.project-detail-content');
        loadProjectContent(targetProj, nextContentContainer);

        const sliderWrapper = document.querySelector('.project-slider-wrapper');
        const activeArticle = sliderWrapper.querySelector('.project-article');
        
        sliderWrapper.style.transition = 'none';

        if (direction === 'next') {
            // Slide left: Append next project to the right
            sliderWrapper.appendChild(nextArticle);
            sliderWrapper.offsetHeight; // force reflow
            sliderWrapper.style.transition = 'transform var(--transition-speed) cubic-bezier(0.76, 0, 0.24, 1)';
            sliderWrapper.style.transform = 'translateX(-100%)';
        } else {
            // Slide right: Prepend next project to the left
            sliderWrapper.insertBefore(nextArticle, activeArticle);
            sliderWrapper.style.transform = 'translateX(-100%)';
            sliderWrapper.offsetHeight; // force reflow
            sliderWrapper.style.transition = 'transform var(--transition-speed) cubic-bezier(0.76, 0, 0.24, 1)';
            sliderWrapper.style.transform = 'translateX(0)';
        }

        // Update URL bar path with history pushState (Only if hosted on server and NOT triggered by popstate)
        if (updateUrl && !isLocal) {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const targetUrl = direction === 'next' ? activeProject.nextLink : activeProject.prevLink;
            if (targetUrl) {
                const hashIndex = targetUrl.indexOf('#');
                let cleanUrl = hashIndex !== -1 ? targetUrl.substring(0, hashIndex) : targetUrl;
                const hash = hashIndex !== -1 ? targetUrl.substring(hashIndex) : '';
                
                const finalUrl = cleanUrl + `?theme=${currentTheme}` + hash;
                history.pushState(null, '', finalUrl);
            }
        }

        // Update site tab title
        document.title = `${targetProj.title} - Rajat Bidarkota`;

        // Safe cleanup timers to guarantee transition resetting
        let transitionCleared = false;
        
        const onTransitionEnd = (e) => {
            // Filter other transitioned properties (like banner opacity load or color transitions)
            if (e && e.propertyName !== 'transform') return;
            if (transitionCleared) return;
            transitionCleared = true;

            console.log(`Transition completed for targetId=${targetId}`);
            sliderWrapper.removeEventListener('transitionend', onTransitionEnd);
            
            // Remove old slide
            sliderWrapper.removeChild(activeArticle);
            
            // Reset wrapper translation
            sliderWrapper.style.transition = 'none';
            sliderWrapper.style.transform = 'translateX(0)';
            
            // Set body state parameters
            document.body.setAttribute('data-project-id', targetId);
            activeProject = PROJECTS_DATABASE[targetId];
            
            // Re-setup navigation arrows
            setupNavigationArrows();
            
            appendThemeToLinks();
            isTransitioning = false;
        };

        sliderWrapper.addEventListener('transitionend', onTransitionEnd);
        // Fallback timer (450ms) to ensure it resets even if transition events are missed/optimized by the browser
        setTimeout(() => {
            if (!transitionCleared) {
                console.log("onTransitionEnd fallback timer fired!");
                onTransitionEnd(null);
            }
        }, 450);
    };

    // Intercept click listener on navigation arrows to trigger slide animations
    document.addEventListener('click', (e) => {
        const arrow = e.target.closest('.project-nav-arrow');
        if (!arrow) return;
        
        // If previewing locally via file://, let browser native navigation handle it to avoid pushState security block
        if (isLocal) {
            console.log("Local filesystem detected. Letting browser native link navigation run.");
            return;
        }
        
        e.preventDefault();
        
        const isNext = arrow.classList.contains('next-project');
        const direction = isNext ? 'next' : 'prev';
        
        const currentId = document.body.getAttribute('data-project-id');
        const currentProj = PROJECTS_DATABASE[currentId];
        
        console.log(`Arrow clicked: isNext=${isNext}, currentId=${currentId}`);
        if (currentProj) {
            const targetLink = isNext ? currentProj.nextLink : currentProj.prevLink;
            // Stop click actions if there's no navigation link (leftmost / rightmost project anchor)
            if (!targetLink) {
                console.log("No target link available, click ignored.");
                return;
            }
            
            const targetId = targetLink.includes('TVC') ? 'tvc-rocket' : 'inverted-pendulum';
            slideToProject(direction, targetId);
        }
    });

    // Handle browser back/forward buttons during project details slide sessions
    window.addEventListener('popstate', () => {
        if (isLocal) return; // Ignore on local file protocol

        const path = window.location.pathname;
        const targetId = path.includes('TVC') ? 'tvc-rocket' : 'inverted-pendulum';
        const currentId = document.body.getAttribute('data-project-id');
        
        console.log(`popstate triggered: targetId=${targetId}, currentId=${currentId}`);
        if (targetId !== currentId && PROJECTS_DATABASE[targetId]) {
            const direction = (targetId === 'tvc-rocket') ? 'prev' : 'next';
            slideToProject(direction, targetId, false); // Pass false to prevent history push recursion
        }
    });

    // Run initial link theme updates
    appendThemeToLinks();
});
