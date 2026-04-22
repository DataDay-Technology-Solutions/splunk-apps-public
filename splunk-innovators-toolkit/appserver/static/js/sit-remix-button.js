/**
 * Splunk Innovators Toolkit — Remix Button
 * ==========================================
 * Add this script to any dashboard to show a floating
 * "Edit in Design Studio" button. One click opens the
 * dashboard in Design Studio for visual editing.
 *
 * Usage: script="splunk-innovators-toolkit:js/sit-remix-button.js"
 */

require(['jquery'], function($) {
    'use strict';

    // Don't show on Design Studio itself
    if (window.location.pathname.indexOf('design_studio') !== -1) return;
    // Don't show on edit pages
    if (window.location.search.indexOf('edit=') !== -1) return;

    // Extract current app and dashboard from URL
    // URL pattern: /en-US/app/{app_name}/{dashboard_name}
    var pathMatch = window.location.pathname.match(/\/app\/([^\/]+)\/([^\/\?]+)/);
    if (!pathMatch) return;

    var currentApp = pathMatch[1];
    var currentDash = pathMatch[2];

    // Don't show on non-dashboard pages
    var skipPages = ['search', 'report', 'alerts', 'dashboards', 'datasets', 'messages'];
    if (skipPages.indexOf(currentDash) !== -1) return;

    var studioUrl = '/en-US/app/splunk-innovators-toolkit/design_studio?remix=' +
        encodeURIComponent(currentApp) + '/' + encodeURIComponent(currentDash);

    var $btn = $('<a>')
        .addClass('sit-remix-btn')
        .attr('href', studioUrl)
        .attr('title', 'Edit this dashboard in Design Studio')
        .css({
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 10000,
            background: 'linear-gradient(135deg, #FD1875, #d41565)',
            color: '#fff',
            borderRadius: '28px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(253, 24, 117, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            opacity: '0.9'
        })
        .html('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Remix in Design Studio')
        .on('mouseenter', function() {
            $(this).css({ opacity: '1', transform: 'translateY(-2px)', boxShadow: '0 6px 24px rgba(253, 24, 117, 0.5)' });
        })
        .on('mouseleave', function() {
            $(this).css({ opacity: '0.9', transform: 'translateY(0)', boxShadow: '0 4px 16px rgba(253, 24, 117, 0.4)' });
        });

    $('body').append($btn);
});
