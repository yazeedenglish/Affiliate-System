document.addEventListener("DOMContentLoaded", () => {
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
        return;
    }

    const elements = [
        ...document.querySelectorAll(
            ".section-heading, .benefit-card, .step-card, .final-cta"
        )
    ];

    elements.forEach((element) => {
        element.classList.add("reveal");
    });

    // Reveal cards one after another within each group.
    [".benefits-grid", ".steps-grid"].forEach((selector) => {
        document.querySelectorAll(selector).forEach((group) => {
            [...group.children].forEach((card, index) => {
                card.style.setProperty(
                    "--reveal-delay",
                    `${index * 120}ms`
                );
            });
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -35px 0px"
    });

    elements.forEach((element) => observer.observe(element));
});