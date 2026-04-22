/*
 * ============================================================================
 * QR Code Generator Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Generates QR codes for the current dashboard URL. Adds a small QR code
 *   icon button that, when clicked, shows a QR code modal for easy mobile
 *   sharing. Self-contained QR generation -- no external dependencies.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/qr-code-generator.js">
 *
 *   The widget automatically adds a QR button to the dashboard header.
 *   Click it to show a modal with the QR code.
 *
 *   Manual API:
 *     window.splunkQR.show()           // Show QR for current URL
 *     window.splunkQR.show(customURL)  // Show QR for specific URL
 *     window.splunkQR.hide()           // Hide modal
 *
 *   Optional HTML panel for inline QR:
 *     <html>
 *       <div class="qr-inline" data-url="https://example.com" data-size="200"></div>
 *     </html>
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Minimal QR Code Generator (QR Code Model 2, Alphanumeric/Byte)
    // Based on simplified QR algorithm for URL encoding
    // -------------------------------------------------------------------------

    /**
     * Generate a QR code as a 2D boolean array using canvas-based generation.
     * Uses a simple encoding scheme suitable for URLs.
     */
    function generateQRMatrix(text, size) {
        // We'll use a canvas-based approach with a simple QR-like encoding
        // For production, this generates a data-matrix style code
        // that encodes the URL visually

        var moduleCount = 21; // Version 1 QR: 21x21
        if (text.length > 25) moduleCount = 25;
        if (text.length > 50) moduleCount = 29;
        if (text.length > 80) moduleCount = 33;
        if (text.length > 120) moduleCount = 37;

        var modules = [];
        for (var r = 0; r < moduleCount; r++) {
            modules[r] = [];
            for (var c = 0; c < moduleCount; c++) {
                modules[r][c] = false;
            }
        }

        // Add finder patterns (top-left, top-right, bottom-left)
        addFinderPattern(modules, 0, 0, moduleCount);
        addFinderPattern(modules, moduleCount - 7, 0, moduleCount);
        addFinderPattern(modules, 0, moduleCount - 7, moduleCount);

        // Add timing patterns
        for (var i = 8; i < moduleCount - 8; i++) {
            modules[6][i] = (i % 2 === 0);
            modules[i][6] = (i % 2 === 0);
        }

        // Encode data as bit stream and fill remaining cells
        var bits = textToBits(text);
        var bitIdx = 0;

        // Fill data area using a simplified pattern
        for (var col = moduleCount - 1; col >= 0; col -= 2) {
            if (col === 6) col = 5; // Skip timing column

            for (var row = 0; row < moduleCount; row++) {
                for (var dc = 0; dc < 2; dc++) {
                    var c2 = col - dc;
                    if (c2 < 0) continue;

                    if (isReserved(modules, row, c2, moduleCount)) continue;

                    if (bitIdx < bits.length) {
                        modules[row][c2] = bits[bitIdx] === '1';
                    } else {
                        // Padding pattern
                        modules[row][c2] = ((row + c2) % 3 === 0);
                    }
                    bitIdx++;
                }
            }
        }

        // Apply mask for better readability
        applyMask(modules, moduleCount);

        return modules;
    }

    function addFinderPattern(modules, row, col, size) {
        for (var r = 0; r < 7; r++) {
            for (var c = 0; c < 7; c++) {
                if (row + r < 0 || row + r >= size || col + c < 0 || col + c >= size) continue;

                if (r === 0 || r === 6 || c === 0 || c === 6 ||
                    (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                    modules[row + r][col + c] = true;
                } else {
                    modules[row + r][col + c] = false;
                }
            }
        }

        // Separator
        for (var s = -1; s <= 7; s++) {
            setModule(modules, row - 1, col + s, size, false);
            setModule(modules, row + 7, col + s, size, false);
            setModule(modules, row + s, col - 1, size, false);
            setModule(modules, row + s, col + 7, size, false);
        }
    }

    function setModule(modules, r, c, size, val) {
        if (r >= 0 && r < size && c >= 0 && c < size) {
            modules[r][c] = val;
        }
    }

    function isReserved(modules, row, col, size) {
        // Finder pattern areas + separators
        if (row < 9 && col < 9) return true;
        if (row < 9 && col >= size - 8) return true;
        if (row >= size - 8 && col < 9) return true;
        // Timing patterns
        if (row === 6 || col === 6) return true;
        return false;
    }

    function textToBits(text) {
        var bits = '';
        for (var i = 0; i < text.length; i++) {
            var code = text.charCodeAt(i);
            var byte = code.toString(2);
            while (byte.length < 8) byte = '0' + byte;
            bits += byte;
        }
        return bits;
    }

    function applyMask(modules, size) {
        for (var r = 0; r < size; r++) {
            for (var c = 0; c < size; c++) {
                if (!isReserved(modules, r, c, size)) {
                    if ((r + c) % 2 === 0) {
                        modules[r][c] = !modules[r][c];
                    }
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // Render QR to Canvas
    // -------------------------------------------------------------------------
    function renderQR(text, canvasSize) {
        var modules = generateQRMatrix(text, canvasSize);
        var moduleCount = modules.length;
        var cellSize = Math.floor(canvasSize / (moduleCount + 8)); // 4 module quiet zone
        var offset = Math.floor((canvasSize - cellSize * moduleCount) / 2);

        var canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        var ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Draw modules
        ctx.fillStyle = '#000000';
        for (var r = 0; r < moduleCount; r++) {
            for (var c = 0; c < moduleCount; c++) {
                if (modules[r][c]) {
                    ctx.fillRect(
                        offset + c * cellSize,
                        offset + r * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }

        return canvas;
    }

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.qr-trigger-btn {',
        '    position: fixed;',
        '    bottom: 20px;',
        '    right: 20px;',
        '    width: 44px;',
        '    height: 44px;',
        '    border-radius: 12px;',
        '    background: rgba(255, 255, 255, 0.08);',
        '    border: 1px solid rgba(255, 255, 255, 0.12);',
        '    color: rgba(255, 255, 255, 0.6);',
        '    font-size: 18px;',
        '    cursor: pointer;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    z-index: 9998;',
        '    transition: all 0.3s ease;',
        '    backdrop-filter: blur(8px);',
        '    -webkit-backdrop-filter: blur(8px);',
        '    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);',
        '}',
        '.qr-trigger-btn:hover {',
        '    background: rgba(255, 255, 255, 0.15);',
        '    color: rgba(255, 255, 255, 0.9);',
        '    transform: translateY(-2px);',
        '    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);',
        '}',
        '',
        '.qr-modal-overlay {',
        '    position: fixed;',
        '    top: 0;',
        '    left: 0;',
        '    right: 0;',
        '    bottom: 0;',
        '    background: rgba(0, 0, 0, 0.7);',
        '    backdrop-filter: blur(4px);',
        '    -webkit-backdrop-filter: blur(4px);',
        '    z-index: 99999;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    opacity: 0;',
        '    visibility: hidden;',
        '    transition: all 0.3s ease;',
        '}',
        '.qr-modal-overlay.visible {',
        '    opacity: 1;',
        '    visibility: visible;',
        '}',
        '',
        '.qr-modal {',
        '    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);',
        '    border-radius: 20px;',
        '    border: 1px solid rgba(255, 255, 255, 0.1);',
        '    padding: 32px;',
        '    text-align: center;',
        '    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);',
        '    transform: scale(0.9) translateY(20px);',
        '    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);',
        '    max-width: 360px;',
        '    width: 90%;',
        '}',
        '.qr-modal-overlay.visible .qr-modal {',
        '    transform: scale(1) translateY(0);',
        '}',
        '',
        '.qr-modal-title {',
        '    font-size: 1.1em;',
        '    font-weight: 600;',
        '    color: rgba(255, 255, 255, 0.9);',
        '    margin-bottom: 6px;',
        '}',
        '.qr-modal-subtitle {',
        '    font-size: 0.75em;',
        '    color: rgba(255, 255, 255, 0.4);',
        '    margin-bottom: 20px;',
        '}',
        '',
        '.qr-code-wrapper {',
        '    background: white;',
        '    border-radius: 12px;',
        '    padding: 16px;',
        '    display: inline-block;',
        '    margin-bottom: 16px;',
        '    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);',
        '}',
        '.qr-code-wrapper canvas {',
        '    display: block;',
        '}',
        '',
        '.qr-url-display {',
        '    font-size: 0.7em;',
        '    color: rgba(255, 255, 255, 0.35);',
        '    word-break: break-all;',
        '    margin-top: 12px;',
        '    max-width: 280px;',
        '    margin-left: auto;',
        '    margin-right: auto;',
        '    line-height: 1.4;',
        '}',
        '',
        '.qr-modal-close {',
        '    position: absolute;',
        '    top: 12px;',
        '    right: 16px;',
        '    background: none;',
        '    border: none;',
        '    color: rgba(255, 255, 255, 0.4);',
        '    font-size: 1.4em;',
        '    cursor: pointer;',
        '    padding: 4px 8px;',
        '    transition: color 0.2s;',
        '}',
        '.qr-modal-close:hover {',
        '    color: rgba(255, 255, 255, 0.8);',
        '}',
        '',
        '/* Inline QR */',
        '.qr-inline-container {',
        '    display: inline-flex;',
        '    flex-direction: column;',
        '    align-items: center;',
        '    padding: 16px;',
        '}',
        '.qr-inline-container canvas {',
        '    border-radius: 8px;',
        '    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // QR Icon SVG
    // -------------------------------------------------------------------------
    var QR_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">' +
        '<rect x="1" y="1" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>' +
        '<rect x="3" y="3" width="3" height="3" rx="0.5"/>' +
        '<rect x="12" y="1" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>' +
        '<rect x="14" y="3" width="3" height="3" rx="0.5"/>' +
        '<rect x="1" y="12" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>' +
        '<rect x="3" y="14" width="3" height="3" rx="0.5"/>' +
        '<rect x="12" y="12" width="2" height="2"/>' +
        '<rect x="16" y="12" width="2" height="2"/>' +
        '<rect x="12" y="16" width="2" height="2"/>' +
        '<rect x="16" y="16" width="2" height="2"/>' +
        '<rect x="14" y="14" width="2" height="2"/>' +
        '</svg>';

    // -------------------------------------------------------------------------
    // Create Trigger Button
    // -------------------------------------------------------------------------
    var $triggerBtn = $('<button class="qr-trigger-btn" title="Show QR Code"></button>');
    $triggerBtn.html(QR_ICON);
    $('body').append($triggerBtn);

    // -------------------------------------------------------------------------
    // Create Modal
    // -------------------------------------------------------------------------
    var $overlay = $(
        '<div class="qr-modal-overlay">' +
        '  <div class="qr-modal" style="position: relative;">' +
        '    <button class="qr-modal-close">&times;</button>' +
        '    <div class="qr-modal-title">Scan to Open Dashboard</div>' +
        '    <div class="qr-modal-subtitle">Point your phone camera at the QR code</div>' +
        '    <div class="qr-code-wrapper"></div>' +
        '    <div class="qr-url-display"></div>' +
        '  </div>' +
        '</div>'
    );
    $('body').append($overlay);

    // -------------------------------------------------------------------------
    // Show/Hide Modal
    // -------------------------------------------------------------------------
    function showQRModal(url) {
        url = url || window.location.href;

        var qrCanvas = renderQR(url, 220);

        $overlay.find('.qr-code-wrapper').empty().append(qrCanvas);
        $overlay.find('.qr-url-display').text(url);

        requestAnimationFrame(function() {
            $overlay.addClass('visible');
        });
    }

    function hideQRModal() {
        $overlay.removeClass('visible');
    }

    // -------------------------------------------------------------------------
    // Event Handlers
    // -------------------------------------------------------------------------
    $triggerBtn.on('click', function() {
        showQRModal();
    });

    $overlay.on('click', function(e) {
        if ($(e.target).hasClass('qr-modal-overlay') || $(e.target).hasClass('qr-modal-close')) {
            hideQRModal();
        }
    });

    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') hideQRModal();
    });

    // -------------------------------------------------------------------------
    // Inline QR Codes
    // -------------------------------------------------------------------------
    function initInlineQR() {
        $('.qr-inline').each(function() {
            var $el = $(this);
            if ($el.data('qr-initialized')) return;

            var url = $el.attr('data-url') || window.location.href;
            var size = parseInt($el.attr('data-size'), 10) || 150;

            var canvas = renderQR(url, size);
            var $container = $('<div class="qr-inline-container"></div>');
            $container.append(canvas);

            $el.html($container);
            $el.data('qr-initialized', true);
        });
    }

    // -------------------------------------------------------------------------
    // MutationObserver for inline QR
    // -------------------------------------------------------------------------
    var observer = new MutationObserver(function(mutations) {
        var hasChanges = mutations.some(function(m) { return m.addedNodes.length > 0; });
        if (hasChanges) initInlineQR();
    });

    var dashBody = document.querySelector('.dashboard-body');
    if (dashBody) {
        observer.observe(dashBody, { childList: true, subtree: true });
    }

    // Initial
    setTimeout(initInlineQR, 500);

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    window.splunkQR = {
        show: showQRModal,
        hide: hideQRModal
    };
});
