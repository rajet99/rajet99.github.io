document.addEventListener('DOMContentLoaded', () => {
    // Sizing changes for Header/Navbar on scroll
    const navbar = document.getElementById('navbar');
    
    const handleScroll = () => {
        if (window.scrollY > 20) {
            navbar.classList.remove('header-large');
        } else {
            navbar.classList.add('header-large');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run immediately to establish initial state

    // Theme Toggle implementation (Wrapped in try/catch to support sandboxed file:// environments)
    const themeToggleBtn = document.getElementById('theme-toggle');
    const urlParams = new URLSearchParams(window.location.search);
    const urlTheme = urlParams.get('theme');
    
    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem('theme');
    } catch (e) {
        console.warn('localStorage is blocked in this browser environment.');
    }
    
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = urlTheme || savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Helper to append theme parameter to relative links
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
            
            if (href.startsWith('.') || href.startsWith('/') || href.includes('index.html') || href.includes('?theme=')) {
                // Ignore external domains
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
                    console.error('Failed to append theme to link: ' + href, e);
                }
            }
        });
    };
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {
            console.warn('Failed to save theme choice to localStorage.');
        }

        // Dynamically update address URL parameter to prevent flashes on refresh
        const url = new URL(window.location.href);
        url.searchParams.set('theme', newTheme);
        window.history.replaceState({}, '', url.toString());
        
        // Push current theme to all relative anchors
        appendThemeToLinks();
    });

    // Run initial link update
    appendThemeToLinks();

    // Horizontal Page Slider & Client-Side Routing setup
    const sectionsSlider = document.getElementById('sections-slider');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = ['home', 'projects', 'about'];
    
    // Check if hosted or running locally under file://
    const isLocalFile = window.location.protocol === 'file:';

    // Slide to target page
    const slideToPage = (pageId) => {
        const pageIndex = pages.indexOf(pageId);
        if (pageIndex !== -1) {
            // Slide the page container horizontally (percentage-based relative to 300% width slider)
            sectionsSlider.style.transform = `translateX(-${(pageIndex * 100) / 3}%)`;
            
            // Update navigation link active styling
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const cleanHref = href.replace('#', '').split('?')[0];
                    if (cleanHref === pageId || (pageId === 'home' && cleanHref === '')) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                }
            });
            
            // Scroll user back to top of container smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Main navigation router function
    const navigateTo = (pageId, updateUrl = true) => {
        if (!pages.includes(pageId)) return;

        slideToPage(pageId);

        if (updateUrl) {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const themeParam = `theme=${currentTheme}`;
            
            if (isLocalFile) {
                window.location.hash = `${pageId}?${themeParam}`;
            } else {
                // hosted on github.io/repo subfolder or custom domain
                const path = window.location.pathname;
                const repoPath = path.substring(0, path.lastIndexOf('/index.html')) || path.substring(0, path.lastIndexOf('/')) || '';
                const cleanRoot = repoPath.endsWith('/') ? repoPath : repoPath + '/';
                const targetPath = pageId === 'home' ? cleanRoot : cleanRoot + pageId;
                
                history.pushState({ pageId }, '', `${targetPath}?${themeParam}`);
            }
        }
        
        // Re-sync all link href attributes to matching theme parameter
        appendThemeToLinks();
    };

    // Get page from current URL pathname or hash
    const getPageFromUrl = () => {
        if (isLocalFile) {
            const hash = window.location.hash.replace('#', '') || 'home';
            const cleanHash = hash.split('?')[0];
            return pages.includes(cleanHash) ? cleanHash : 'home';
        } else {
            const path = window.location.pathname;
            const segments = path.split('/').filter(Boolean);
            const lastSegment = segments[segments.length - 1] || 'home';
            return pages.includes(lastSegment) ? lastSegment : 'home';
        }
    };

    // Intercept click events to handle relative local paths as SPA transitions
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href) return;
        
        // If same-page hash click (like #projects or #about) or relative project slide clicks
        const isSamePageAnchor = href.startsWith('#');
        let pageId = null;
        
        if (isSamePageAnchor) {
            pageId = href.replace('#', '').split('?')[0];
        } else if (href.startsWith('.') || href.startsWith('/') || href.includes('index.html')) {
            // Check if it redirects to one of our slider page sections
            const filename = href.split('/').pop().split('?')[0].replace('#', '');
            if (pages.includes(filename)) {
                pageId = filename;
            }
        }
        
        if (pageId && pages.includes(pageId)) {
            e.preventDefault();
            navigateTo(pageId);
        }
    });

    // Handle browser Back/Forward history navigation
    window.addEventListener('popstate', (e) => {
        if (!isLocalFile) {
            const pageId = getPageFromUrl();
            navigateTo(pageId, false);
        }
    });

    // Handle hash changes locally under file://
    window.addEventListener('hashchange', () => {
        if (isLocalFile) {
            const pageId = getPageFromUrl();
            navigateTo(pageId, false);
        }
    });

    // Logo click behavior (resets to home cleanly)
    const logoNav = document.getElementById('logo-nav');
    if (logoNav) {
        logoNav.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('home');
        });
    }

    // INTERCEPT REDIRECTS (Handles custom 404 redirections on initial load)
    const redirectPath = urlParams.get('redirect');
    if (redirectPath && !isLocalFile) {
        // Resolve target subpage from redirect path string
        const targetPage = redirectPath.split('/').filter(Boolean).pop() || 'home';
        if (pages.includes(targetPage)) {
            // Clear URL search params immediately to restore clean address bar
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const cleanUrl = window.location.origin + redirectPath + `?theme=${currentTheme}`;
            window.history.replaceState({}, '', cleanUrl);
            
            // Navigate to page panel index
            slideToPage(targetPage);
        }
    } else {
        // Initial setup load based on landing URL
        const initialPage = getPageFromUrl();
        slideToPage(initialPage);
    }

    // Intercept clicks on project card GitHub icons to navigate directly to the repo
    document.addEventListener('click', (e) => {
        const githubIcon = e.target.closest('.card-github-icon');
        if (!githubIcon) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const card = githubIcon.closest('.project-card');
        if (card) {
            let repoUrl = '';
            if (card.id === 'card-tvc-rocket') {
                repoUrl = 'https://github.com/rajet99/tvc-experimentation';
            } else if (card.id === 'card-inverted-pendulum') {
                repoUrl = 'https://github.com/rajet99/inverted-pendulum';
            }
            
            if (repoUrl) {
                window.open(repoUrl, '_blank', 'noopener,noreferrer');
            }
        }
    });
});
