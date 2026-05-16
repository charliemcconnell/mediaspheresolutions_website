(function () {
    var BOOKING_URL = 'https://links.mediaspheresolutions.com/widget/booking/BJlPB1Ss8QzCbeUzWAwh';
    var STORAGE_KEY = 'mss-popup-dismissed-until';
    var DISMISS_DAYS = 7;
    var SCROLL_TRIGGER = 0.5;

    function isDismissed() {
        try {
            var until = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
            return Date.now() < until;
        } catch (e) {
            return false;
        }
    }

    function setDismissed() {
        try {
            localStorage.setItem(STORAGE_KEY, String(Date.now() + DISMISS_DAYS * 86400000));
        } catch (e) {}
    }

    function build() {
        var aside = document.createElement('aside');
        aside.className = 'mss-popup';
        aside.id = 'mss-popup';
        aside.setAttribute('role', 'complementary');
        aside.setAttribute('aria-label', 'Book a free call');
        aside.innerHTML =
            '<button class="mss-popup-close" type="button" aria-label="Dismiss">&times;</button>' +
            '<p class="mss-popup-eyebrow">Like what you see?</p>' +
            '<p class="mss-popup-body">Book a free call. No pitch, no pressure — just value.</p>' +
            '<a class="mss-popup-cta" href="' + BOOKING_URL + '" target="_blank" rel="noopener">Book a Free Call →</a>';
        document.body.appendChild(aside);

        aside.querySelector('.mss-popup-close').addEventListener('click', function () {
            aside.classList.remove('is-visible');
            setDismissed();
            setTimeout(function () { aside.remove(); }, 400);
        });

        aside.querySelector('.mss-popup-cta').addEventListener('click', function () {
            setDismissed();
        });

        return aside;
    }

    function init() {
        if (isDismissed()) return;

        var aside = build();
        var shown = false;
        var ticking = false;

        function check() {
            ticking = false;
            if (shown) return;
            var doc = document.documentElement;
            var scrollable = (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight;
            if (scrollable <= 0) return;
            var ratio = (window.scrollY || window.pageYOffset) / scrollable;
            if (ratio >= SCROLL_TRIGGER) {
                shown = true;
                window.removeEventListener('scroll', onScroll);
                requestAnimationFrame(function () { aside.classList.add('is-visible'); });
            }
        }

        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(check);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        check();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
