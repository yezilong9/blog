(function () {
    'use strict';

    var language = document.documentElement.lang;
    var storageKey = 'harry-blog-language';
    var alternate = document.querySelector('link[rel="alternate"][hreflang="' + (language === 'en' ? 'zh-CN' : 'en') + '"]');

    function remember(value) {
        try {
            localStorage.setItem(storageKey, value);
            return localStorage.getItem(storageKey) === value;
        } catch (_) { return false; }
    }

    function savedLanguage() {
        try { return localStorage.getItem(storageKey); } catch (_) { return null; }
    }

    function browserLanguage() {
        return /^zh\b/i.test(navigator.language || 'zh') ? 'zh-CN' : 'en';
    }

    var homeMeta = document.querySelector('meta[name="blog-home"]');
    if (homeMeta && language === 'zh-CN' && (savedLanguage() || browserLanguage()) !== 'zh-CN') {
        var localizedHome = new URL(homeMeta.content, window.location.href);
        document.querySelectorAll('a[href]:not([data-language])').forEach(function (link) {
            var target = new URL(link.href);
            if (window.location.pathname === localizedHome.pathname || target.origin !== window.location.origin || target.pathname !== localizedHome.pathname) return;
            target.searchParams.set('lang', 'zh-CN');
            link.href = target.href;
        });
    }

    var links = document.querySelectorAll('[data-language]');
    function updateLinks() {
        links.forEach(function (link) {
            var target = new URL(link.href);
            target.search = window.location.search;
            target.hash = window.location.hash;
            if (target.searchParams.has('lang')) target.searchParams.set('lang', link.dataset.language);
            link.href = target.href;
        });
    }
    updateLinks();
    window.addEventListener('hashchange', updateLinks);
    links.forEach(function (link) {
        link.addEventListener('click', function () {
            updateLinks();
            if (!remember(link.dataset.language)) {
                var target = new URL(link.href);
                target.searchParams.set('lang', link.dataset.language);
                link.href = target.href;
            }
        });
    });

    // Honor an explicit language URL; use preferences only at the Chinese home entry.
    var chineseHome = document.querySelector('link[hreflang="zh-CN"]');
    if (!chineseHome || !alternate || language !== 'zh-CN') return;
    var home = new URL(chineseHome.href);
    if (window.location.pathname !== home.pathname || !/\/$/.test(home.pathname)) return;

    var requested = new URLSearchParams(window.location.search).get('lang');
    var preferred = requested === 'en' ? 'en' : /^zh(?:-CN)?$/i.test(requested || '') ? 'zh-CN' : null;
    if (preferred) remember(preferred);
    if (!preferred) preferred = savedLanguage();
    if (!preferred) preferred = browserLanguage();
    if (preferred !== 'en') return;
    var target = new URL(window.location.href);
    target.pathname = new URL(alternate.href).pathname;
    target.search = window.location.search;
    target.hash = window.location.hash;
    window.location.replace(target.href);
})();
