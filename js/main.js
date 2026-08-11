document.addEventListener('DOMContentLoaded', () => {
    // 0. SUPABASE CLIENT INITIALIZATION
    const supabaseUrl = 'https://npyezdxheinqekupwvez.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5weWV6ZHhoZWlucWVrdXB3dmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNDkzMDEsImV4cCI6MjEwMTcyNTMwMX0.gzy-iNlkPMtmruLtF_I4-HpPhpucR0sIJEeI_4Vqj_k';
    const supabase = (window.supabase && supabaseUrl && supabaseKey) ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

    // 1. LOADING SCREEN
    const loader = document.getElementById('loader');
    
    // Ensure loader shows for at least 1.5s
    const startTime = Date.now();
    const minLoaderTime = 1500;
    
    window.addEventListener('load', () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoaderTime - elapsedTime);
        
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
                document.body.classList.remove('loading');
                document.body.classList.add('loaded');
                initScrollReveal();
            }, 500); // Wait for transition
        }, remainingTime);
    });

    // Fallback if load event doesn't fire or takes too long
    setTimeout(() => {
        if(document.body.classList.contains('loading')) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
                document.body.classList.remove('loading');
                document.body.classList.add('loaded');
                initScrollReveal();
            }, 500);
        }
    }, 5000);

    // 2. NAVIGATION
    const nav = document.getElementById('main-nav');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    const mobileOverlay = document.querySelector('.mobile-menu-overlay');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, { passive: true });

    // Mobile menu toggle
    const toggleMenu = () => {
        const isExpanded = mobileBtn.getAttribute('aria-expanded') === 'true';
        mobileBtn.setAttribute('aria-expanded', !isExpanded);
        navLinksContainer.classList.toggle('active');
        mobileBtn.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        document.body.style.overflow = isExpanded ? '' : 'hidden';
    };

    mobileBtn.addEventListener('click', toggleMenu);
    mobileOverlay.addEventListener('click', toggleMenu);

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                
                // Close mobile menu if open
                if (navLinksContainer.classList.contains('active')) {
                    toggleMenu();
                }

                const navHeight = nav.offsetHeight;
                const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. HERO CANVAS PARTICLES
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        initParticles();
    }

    function initParticles() {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        
        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        
        window.addEventListener('resize', resize);
        resize();
        
        const particleCount = window.innerWidth > 768 ? 120 : 60;
        
        class Particle {
            constructor(isGlowing = false) {
                this.isGlowing = isGlowing;
                this.reset();
                this.y = Math.random() * height; // initial random spread
            }
            
            reset() {
                this.x = Math.random() * width;
                this.y = height + 10;
                this.radius = this.isGlowing ? Math.random() * 2 + 4 : Math.random() * 2 + 1;
                this.speed = Math.random() * 1 + 0.2;
                this.opacity = Math.random() * 0.6 + 0.2;
                this.drift = (Math.random() - 0.5) * 0.5;
            }
            
            update() {
                this.y -= this.speed;
                this.x += this.drift;
                
                if (this.y < -10) {
                    this.reset();
                }
            }
            
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                
                if (this.isGlowing) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'rgba(197, 149, 43, 0.8)';
                    ctx.fillStyle = `rgba(255, 223, 137, ${this.opacity})`;
                } else {
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = `rgba(197, 149, 43, ${this.opacity})`;
                }
                
                ctx.fill();
            }
        }
        
        // Regular particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(false));
        }
        
        // Glowing particles
        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(true));
        }
        
        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }

    // 4. SCROLL REVEAL
    function initScrollReveal() {
        if (prefersReducedMotion) {
            document.querySelectorAll('.reveal-on-scroll').forEach(el => {
                el.classList.add('revealed');
            });
            return;
        }

        const revealOptions = {
            threshold: 0.15,
            rootMargin: '-50px 0px'
        };

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    
                    // Handle stagger
                    const stagger = el.getAttribute('data-stagger');
                    if (stagger) {
                        setTimeout(() => {
                            el.classList.add('revealed');
                        }, parseInt(stagger) * 150);
                    } else {
                        el.classList.add('revealed');
                    }
                    
                    observer.unobserve(el);
                }
            });
        }, revealOptions);

        document.querySelectorAll('.reveal-on-scroll').forEach(el => {
            revealObserver.observe(el);
        });
    }

    // 5. PRODUCT FILTERING
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            productCards.forEach(card => {
                // Remove animation class
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    const category = card.getAttribute('data-category');
                    if (filterValue === 'all' || category.includes(filterValue)) {
                        card.style.display = 'flex';
                        // Trigger reflow
                        void card.offsetWidth;
                        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    } else {
                        card.style.display = 'none';
                    }
                }, 300);
            });
        });
    });

    // 6. STATISTICS COUNTER
    const statNumbers = document.querySelectorAll('.stat-number');
    let statsAnimated = false;

    if (!prefersReducedMotion) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !statsAnimated) {
                statsAnimated = true;
                
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    const duration = 2000;
                    const frameDuration = 1000 / 60;
                    const totalFrames = Math.round(duration / frameDuration);
                    let frame = 0;
                    
                    // Ease out quart function
                    const easeOut = t => 1 - Math.pow(1 - t, 4);
                    
                    const counter = setInterval(() => {
                        frame++;
                        const progress = easeOut(frame / totalFrames);
                        const current = Math.round(target * progress);
                        
                        stat.textContent = current.toLocaleString();
                        
                        if (frame === totalFrames) {
                            clearInterval(counter);
                            stat.textContent = target.toLocaleString();
                        }
                    }, frameDuration);
                });
            }
        }, { threshold: 0.5 });

        const statsSection = document.getElementById('statistics');
        if (statsSection) {
            statsObserver.observe(statsSection);
        }
    } else {
        // Fallback for reduced motion
        statNumbers.forEach(stat => {
            stat.textContent = parseInt(stat.getAttribute('data-target')).toLocaleString();
        });
    }

    // 7. TESTIMONIAL CAROUSEL
    const carousel = document.getElementById('testimonial-carousel');
    if (carousel && !prefersReducedMotion) {
        let isDown = false;
        let startX;
        let scrollLeft;
        let autoScrollInterval;

        // Auto scroll
        const startAutoScroll = () => {
            autoScrollInterval = setInterval(() => {
                const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
                if (carousel.scrollLeft >= maxScrollLeft - 10) {
                    carousel.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    carousel.scrollBy({ left: 350, behavior: 'smooth' });
                }
            }, 4000);
        };

        const stopAutoScroll = () => {
            clearInterval(autoScrollInterval);
        };

        startAutoScroll();
        carousel.addEventListener('mouseenter', stopAutoScroll);
        carousel.addEventListener('mouseleave', startAutoScroll);

        // Drag to scroll (mouse)
        carousel.addEventListener('mousedown', (e) => {
            isDown = true;
            carousel.classList.add('active');
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
            stopAutoScroll();
        });
        
        carousel.addEventListener('mouseleave', () => {
            isDown = false;
            carousel.classList.remove('active');
            startAutoScroll();
        });
        
        carousel.addEventListener('mouseup', () => {
            isDown = false;
            carousel.classList.remove('active');
        });
        
        carousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2;
            carousel.scrollLeft = scrollLeft - walk;
        });
    }

    // 8. PARALLAX EFFECT
    const parallaxBg = document.querySelector('.parallax-bg');
    if (parallaxBg && !prefersReducedMotion) {
        window.addEventListener('scroll', () => {
            requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                const section = document.querySelector('.artisan');
                const offsetTop = section.offsetTop;
                
                // Only animate if section is near viewport
                if (scrolled + window.innerHeight > offsetTop && scrolled < offsetTop + section.offsetHeight) {
                    const yPos = (scrolled - offsetTop) * 0.3;
                    parallaxBg.style.transform = `translateY(${yPos}px)`;
                }
            });
        }, { passive: true });
    }

    // 9. CURSOR TRAIL (Desktop only)
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (hasFinePointer && !prefersReducedMotion) {
        const cursorDot = document.getElementById('cursor-dot');
        const cursorTrail = document.getElementById('cursor-trail');
        
        let mouseX = 0;
        let mouseY = 0;
        let dotX = 0;
        let dotY = 0;
        let trailX = 0;
        let trailY = 0;
        
        // Hide native cursor over product images
        const productWrappers = document.querySelectorAll('.product-image-wrapper');
        let isHovering = false;
        
        productWrappers.forEach(wrapper => {
            wrapper.addEventListener('mouseenter', () => {
                isHovering = true;
                cursorDot.style.opacity = '1';
                cursorTrail.style.opacity = '0.5';
            });
            
            wrapper.addEventListener('mouseleave', () => {
                isHovering = false;
                cursorDot.style.opacity = '0';
                cursorTrail.style.opacity = '0';
            });
        });
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Immediate update for dot
            if (isHovering) {
                dotX = mouseX;
                dotY = mouseY;
                cursorDot.style.transform = `translate(${dotX}px, ${dotY}px)`;
            }
        });
        
        // Spring animation for trail
        const updateTrail = () => {
            if (isHovering) {
                // Easing calculation
                trailX += (mouseX - trailX) * 0.15;
                trailY += (mouseY - trailY) * 0.15;
                
                cursorTrail.style.transform = `translate(${trailX}px, ${trailY}px)`;
            }
            requestAnimationFrame(updateTrail);
        };
        
        updateTrail();
    }

    // 10. NEWSLETTER FORM
    const form = document.getElementById('newsletter-form');
    const formMessage = document.getElementById('form-message');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email-input');
            const email = emailInput.value;
            
            // Basic validation
            if (email && email.includes('@')) {
                const btn = form.querySelector('button');
                const originalText = btn.textContent;
                
                // Loading state
                btn.textContent = 'Subscribing...';
                btn.disabled = true;
                
                const submitLead = async () => {
                    if (supabase) {
                        try {
                            const { error } = await supabase
                                .from('saree_leads')
                                .insert([{ email: email, source: 'newsletter' }]);
                            if (error) {
                                console.error('Supabase insert error:', error);
                            }
                        } catch (err) {
                            console.error('Supabase connection error:', err);
                        }
                    }
                    
                    formMessage.textContent = 'Thank you for joining our heritage family!';
                    formMessage.style.color = '#C5952B'; // Gold color
                    formMessage.style.display = 'block';
                    formMessage.classList.add('fade-in');
                    
                    emailInput.value = '';
                    btn.textContent = originalText;
                    btn.disabled = false;
                    
                    setTimeout(() => {
                        formMessage.style.display = 'none';
                    }, 5000);
                };
                
                submitLead();
            }
        });
    }
});
