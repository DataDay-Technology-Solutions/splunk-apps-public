/**
 * Innovators Toolkit — Feedback Widget
 * ====================================
 * A floating "Send Feedback" button that opens a small modal where users
 * can submit a bug report, feature request, or general feedback. Submissions
 * land in https://feedback-api.datadaytech.com and flow into the same triage
 * pipeline used by all other DataDay apps.
 *
 * Usage:
 *   <dashboard version="1.1"
 *     script="splunk-innovators-toolkit:toolkit-loader.js,
 *             splunk-innovators-toolkit:feedback-widget.js"
 *     stylesheet="splunk-innovators-toolkit:feedback-widget.css">
 *
 * Or auto-load by adding to the dashboard's default scripts in
 * default/data/ui/views/.../<dashboard>.xml.
 *
 * Why a public API key is OK here: the key (`fba_…`) belongs to a single
 * registered "submitter" app (`splunk-innovators-toolkit`) and is rate-
 * limited at feedback-api. Worst case if scraped: someone floods our
 * feedback inbox; we rotate the key and ship a new build.
 */

require(['jquery'], function ($) {
    'use strict';

    var FEEDBACK_API_URL = 'https://feedback-api.datadaytech.com';
    var FEEDBACK_API_KEY = 'fba_dec9807388a310392ffd39c1a087047f68e9ff69f038813368a35cf24d3e0420';
    var APP_VERSION = (window.SIT && window.SIT.version) || '2.0.2';

    function buildModal() {
        // Pre-built; only inserted on first open. Avoids polluting the DOM
        // for users who never click the button.
        if ($('#sit-feedback-modal').length) return;
        var html = ''
            + '<div id="sit-feedback-modal" class="sit-feedback-modal" role="dialog" aria-hidden="true">'
            + '  <div class="sit-feedback-backdrop"></div>'
            + '  <div class="sit-feedback-card">'
            + '    <div class="sit-feedback-header">'
            + '      <span class="sit-feedback-title">Send feedback</span>'
            + '      <button class="sit-feedback-close" aria-label="Close">&times;</button>'
            + '    </div>'
            + '    <div class="sit-feedback-body">'
            + '      <label class="sit-feedback-label">Type</label>'
            + '      <div class="sit-feedback-typegroup">'
            + '        <button type="button" class="sit-feedback-typebtn is-active" data-type="bug">🐛 Bug</button>'
            + '        <button type="button" class="sit-feedback-typebtn" data-type="feature">💡 Feature request</button>'
            + '        <button type="button" class="sit-feedback-typebtn" data-type="feedback">💬 Feedback</button>'
            + '      </div>'
            + '      <label class="sit-feedback-label" for="sit-feedback-title">Title</label>'
            + '      <input type="text" id="sit-feedback-title" maxlength="120" placeholder="Brief summary" />'
            + '      <label class="sit-feedback-label" for="sit-feedback-desc">Details</label>'
            + '      <textarea id="sit-feedback-desc" rows="4" maxlength="2000" placeholder="What happened? What did you expect?"></textarea>'
            + '      <div class="sit-feedback-row sit-feedback-bugonly">'
            + '        <label class="sit-feedback-label" for="sit-feedback-severity">Severity</label>'
            + '        <select id="sit-feedback-severity">'
            + '          <option value="low">Low</option>'
            + '          <option value="medium" selected>Medium</option>'
            + '          <option value="high">High</option>'
            + '          <option value="critical">Critical</option>'
            + '        </select>'
            + '      </div>'
            + '      <label class="sit-feedback-label" for="sit-feedback-email">Your email <span class="sit-feedback-optional">(optional, lets us follow up)</span></label>'
            + '      <input type="email" id="sit-feedback-email" placeholder="you@example.com" />'
            + '    </div>'
            + '    <div class="sit-feedback-footer">'
            + '      <span class="sit-feedback-status" aria-live="polite"></span>'
            + '      <button type="button" class="sit-feedback-cancel">Cancel</button>'
            + '      <button type="button" class="sit-feedback-submit">Send</button>'
            + '    </div>'
            + '  </div>'
            + '</div>';
        $('body').append(html);
    }

    function buildButton() {
        if ($('#sit-feedback-btn').length) return;
        $('body').append(
            '<button id="sit-feedback-btn" class="sit-feedback-btn" type="button" title="Send feedback to the Innovators Toolkit team">'
          +   '<span class="sit-feedback-btn-icon">💬</span>'
          +   '<span class="sit-feedback-btn-label">Feedback</span>'
          + '</button>'
        );
    }

    function getCurrentType() {
        return $('.sit-feedback-typebtn.is-active').data('type') || 'bug';
    }

    function setStatus(text, kind) {
        var $s = $('.sit-feedback-status');
        $s.removeClass('is-error is-success').text(text || '');
        if (kind) $s.addClass(kind === 'error' ? 'is-error' : 'is-success');
    }

    function open() {
        fireEvent('click');           // a click that opens the modal IS the click event
        buildModal();
        $('#sit-feedback-modal').addClass('is-open').attr('aria-hidden', 'false');
        // Focus the first field after the modal opens.
        setTimeout(function () { $('#sit-feedback-title').trigger('focus'); }, 50);
    }

    function close() {
        $('#sit-feedback-modal').removeClass('is-open').attr('aria-hidden', 'true');
        // Clear after a moment so the close animation doesn't show empty fields.
        setTimeout(function () {
            $('#sit-feedback-title').val('');
            $('#sit-feedback-desc').val('');
            $('#sit-feedback-email').val('');
            $('#sit-feedback-severity').val('medium');
            $('.sit-feedback-typebtn').removeClass('is-active');
            $('.sit-feedback-typebtn[data-type="bug"]').addClass('is-active');
            setStatus('');
        }, 250);
    }

    function submit() {
        var type = getCurrentType();
        var title = $.trim($('#sit-feedback-title').val() || '');
        var description = $.trim($('#sit-feedback-desc').val() || '');
        var severity = $('#sit-feedback-severity').val() || 'medium';
        var email = $.trim($('#sit-feedback-email').val() || '');

        if (!title) { setStatus('Please add a short title.', 'error'); return; }
        if (!description) { setStatus('Please describe what happened.', 'error'); return; }

        // Capture context — Splunk dashboard URL, current user (if known via
        // window.$C), and a screenshot is intentionally NOT taken (privacy +
        // payload size).
        var splunkUser = (window.$C && window.$C.USERNAME) || null;
        var splunkApp  = (window.$C && window.$C.APP) || null;
        var dashboardName = (window.$C && (window.$C.VIEW_LABEL || window.$C.VIEW)) || null;

        var payload = {
            type: type,
            title: title,
            description: description,
            severity: type === 'bug' ? severity : 'medium',
            reporter: email ? { email: email, userId: splunkUser } : (splunkUser ? { userId: splunkUser } : undefined),
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                splunkUser: splunkUser,
                splunkApp: splunkApp,
                dashboardName: dashboardName,
                toolkitVersion: APP_VERSION,
            },
            tags: ['splunk-innovators-toolkit', splunkApp].filter(Boolean),
        };

        var $submit = $('.sit-feedback-submit');
        $submit.prop('disabled', true).text('Sending…');
        setStatus('');
        // Fire submit telemetry on intent (before the POST) so we count
        // attempts even when the actual submission fails. The funnel
        // shows "submits" = clicks that reached this point.
        fireEvent('submit');

        $.ajax({
            url: FEEDBACK_API_URL + '/api/feedback',
            method: 'POST',
            contentType: 'application/json',
            headers: { 'X-API-Key': FEEDBACK_API_KEY },
            data: JSON.stringify(payload),
            timeout: 15000,
        })
        .done(function () {
            setStatus('Thanks — we got it.', 'success');
            // Brief pause so the user sees the confirmation, then close.
            setTimeout(close, 1200);
        })
        .fail(function (xhr) {
            var msg = 'Submit failed';
            if (xhr.status === 0) msg = 'Network error — is the dashboard offline?';
            else if (xhr.status === 429) msg = 'Too many submissions — try again in a minute.';
            else if (xhr.responseJSON && xhr.responseJSON.error) msg = xhr.responseJSON.error;
            else if (xhr.statusText) msg = 'Submit failed (' + xhr.status + ' ' + xhr.statusText + ')';
            setStatus(msg, 'error');
        })
        .always(function () {
            $submit.prop('disabled', false).text('Send');
        });
    }

    function bindEvents() {
        // Button → open modal
        $(document).on('click', '#sit-feedback-btn', open);
        // Modal interactions
        $(document).on('click', '.sit-feedback-close, .sit-feedback-cancel, .sit-feedback-backdrop', close);
        $(document).on('click', '.sit-feedback-submit', submit);
        $(document).on('click', '.sit-feedback-typebtn', function () {
            $('.sit-feedback-typebtn').removeClass('is-active');
            $(this).addClass('is-active');
            // Severity row only matters for bugs; toggle visibility.
            var isBug = $(this).data('type') === 'bug';
            $('.sit-feedback-bugonly').toggle(isBug);
        });
        // Esc closes
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && $('#sit-feedback-modal').hasClass('is-open')) close();
        });
        // Cmd/Ctrl+Enter submits
        $(document).on('keydown', '#sit-feedback-modal input, #sit-feedback-modal textarea', function (e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
        });
    }

    /**
     * Fire a widget telemetry event. Best-effort, non-blocking — never
     * surfaces failures to the user. Powers the Apps page funnel
     * (impression → click → submit) without per-event PII (the API
     * hashes client IP server-side; we don't ship raw user identifiers).
     */
    function fireEvent(eventType) {
        try {
            var splunkUser = (window.$C && window.$C.USERNAME) || null;
            var splunkApp  = (window.$C && window.$C.APP) || null;
            $.ajax({
                url: FEEDBACK_API_URL + '/api/feedback/event',
                method: 'POST',
                contentType: 'application/json',
                headers: { 'X-API-Key': FEEDBACK_API_KEY },
                data: JSON.stringify({
                    event_type: eventType,
                    url: window.location.href,
                    user_id: splunkUser,
                    user_agent: navigator.userAgent,
                    metadata: { splunkApp: splunkApp, toolkitVersion: APP_VERSION },
                }),
                timeout: 5000,
            });
        } catch (e) { /* swallow — telemetry must never break the user's flow */ }
    }

    function init() {
        // Splunk dashboards render asynchronously; wait for the chrome to
        // be on screen before adding the floating button so we don't fight
        // any header transitions.
        $(function () {
            buildButton();
            bindEvents();
            // One impression event when the widget renders. The button
            // sits in the corner — a render IS the impression.
            fireEvent('impression');
            // Expose a tiny API on SIT so other Toolkit components can
            // open the feedback modal programmatically (e.g. from an
            // error boundary).
            window.SIT = window.SIT || {};
            window.SIT.feedback = { open: open, close: close, submit: submit };
        });
    }

    init();
});
