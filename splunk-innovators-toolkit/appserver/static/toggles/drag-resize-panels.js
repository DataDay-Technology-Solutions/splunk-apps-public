/**
 * Splunk Innovators Toolkit - Drag Resize Panels
 * =================================================
 * Adds drag handles to panels allowing users to resize panel widths
 * within rows. Drag the border between panels to adjust the layout.
 * Saves the custom layout to localStorage so it persists across sessions.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/drag-resize-panels.js">
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    var STORAGE_KEY = 'sit-panel-sizes';
    var MIN_PANEL_WIDTH_PCT = 15; // Minimum 15% width

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Drag Resize Panels */',
        '',
        '/* Make rows flex containers */',
        '.sit-resizable-row {',
        '    display: flex !important;',
        '    flex-wrap: nowrap !important;',
        '    align-items: stretch;',
        '    position: relative;',
        '}',
        '.sit-resizable-row > .dashboard-cell {',
        '    flex: none !important;',
        '    width: auto;',
        '    float: none !important;',
        '    transition: none;',
        '}',
        '',
        '/* Resize handle */',
        '.sit-resize-handle {',
        '    position: relative;',
        '    width: 8px;',
        '    flex-shrink: 0;',
        '    cursor: col-resize;',
        '    z-index: 10;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '}',
        '.sit-resize-handle::before {',
        '    content: "";',
        '    display: block;',
        '    width: 2px;',
        '    height: 40px;',
        '    max-height: 60%;',
        '    border-radius: 1px;',
        '    background: rgba(255,255,255,0.12);',
        '    transition: height 0.2s ease, background 0.2s ease, width 0.2s ease;',
        '}',
        '.sit-resize-handle:hover::before {',
        '    width: 3px;',
        '    height: 60px;',
        '    background: rgba(91,160,245,0.5);',
        '}',
        '.sit-resize-handle.sit-resizing::before {',
        '    width: 3px;',
        '    height: 80%;',
        '    background: #5ba0f5;',
        '}',
        '',
        '/* Light mode */',
        '.sit-light-mode .sit-resize-handle::before {',
        '    background: rgba(0,0,0,0.1);',
        '}',
        '.sit-light-mode .sit-resize-handle:hover::before {',
        '    background: rgba(60,91,220,0.4);',
        '}',
        '.sit-light-mode .sit-resize-handle.sit-resizing::before {',
        '    background: #3c5bdc;',
        '}',
        '',
        '/* Active resize state - prevent text selection */',
        '.sit-resize-active {',
        '    user-select: none !important;',
        '    -webkit-user-select: none !important;',
        '    cursor: col-resize !important;',
        '}',
        '.sit-resize-active * {',
        '    cursor: col-resize !important;',
        '}',
        '',
        '/* Reset button */',
        '.sit-resize-reset-btn {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    gap: 5px;',
        '    padding: 4px 10px;',
        '    border: 1px solid rgba(255,255,255,0.15);',
        '    border-radius: 14px;',
        '    background: rgba(255,255,255,0.04);',
        '    color: #8a8fa0;',
        '    font-size: 11px;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '    cursor: pointer;',
        '    transition: all 0.2s ease;',
        '    outline: none;',
        '    margin-left: 6px;',
        '}',
        '.sit-resize-reset-btn:hover {',
        '    background: rgba(255,255,255,0.1);',
        '    color: #c4c8d0;',
        '}',
        '.sit-light-mode .sit-resize-reset-btn {',
        '    border-color: rgba(0,0,0,0.12);',
        '    background: rgba(0,0,0,0.03);',
        '    color: #888;',
        '}',
        '.sit-light-mode .sit-resize-reset-btn:hover {',
        '    background: rgba(0,0,0,0.06);',
        '    color: #444;',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-drag-resize-styles').text(styles).appendTo('head');

    // =============================================
    // State management
    // =============================================

    function getSavedSizes() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    function saveSizes(sizes) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
        } catch (e) { /* silent */ }

        $(document).trigger('sit:preference-changed', {
            key: 'panelSizes',
            value: sizes
        });
    }

    function getRowId($row, rowIndex) {
        var firstTitle = $row.find('.panel-head h3').first().text().trim();
        return firstTitle ? 'row-' + firstTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : 'row-' + rowIndex;
    }

    // =============================================
    // Setup resizable rows
    // =============================================

    var $rows = $('.dashboard-body .dashboard-row');
    if (!$rows.length) {
        console.log('[SIT] Drag Resize: No rows found, skipping.');
        return;
    }

    var savedSizes = getSavedSizes();
    var hasResizableRows = false;

    $rows.each(function(rowIndex) {
        var $row = $(this);
        var $cells = $row.find('> .dashboard-cell');

        // Only add handles to rows with multiple cells
        if ($cells.length < 2) return;

        hasResizableRows = true;
        $row.addClass('sit-resizable-row');
        var rowId = getRowId($row, rowIndex);
        $row.attr('data-sit-row-id', rowId);

        var rowWidth = $row.width();
        var cellCount = $cells.length;
        var defaultWidth = 100 / cellCount;
        var savedRowSizes = savedSizes[rowId] || null;

        // Apply sizes to cells
        $cells.each(function(cellIndex) {
            var $cell = $(this);
            var widthPct = savedRowSizes ? (savedRowSizes[cellIndex] || defaultWidth) : defaultWidth;
            $cell.css('width', widthPct + '%');
            $cell.attr('data-sit-cell-index', cellIndex);
        });

        // Insert resize handles between cells
        for (var i = 0; i < cellCount - 1; i++) {
            var $handle = $('<div class="sit-resize-handle"></div>');
            $handle.attr('data-left-index', i);
            $handle.attr('data-right-index', i + 1);
            $handle.attr('data-row-index', rowIndex);

            $cells.eq(i).after($handle);
        }
    });

    if (!hasResizableRows) {
        console.log('[SIT] Drag Resize: No multi-panel rows found, skipping.');
        return;
    }

    // =============================================
    // Drag logic
    // =============================================

    var isDragging = false;
    var $activeHandle = null;
    var $leftCell = null;
    var $rightCell = null;
    var $activeRow = null;
    var startX = 0;
    var startLeftWidth = 0;
    var startRightWidth = 0;

    $(document).on('mousedown', '.sit-resize-handle', function(e) {
        e.preventDefault();

        $activeHandle = $(this);
        $activeRow = $activeHandle.closest('.sit-resizable-row');
        var leftIdx = parseInt($activeHandle.data('left-index'), 10);
        var rightIdx = parseInt($activeHandle.data('right-index'), 10);

        $leftCell = $activeRow.find('[data-sit-cell-index="' + leftIdx + '"]');
        $rightCell = $activeRow.find('[data-sit-cell-index="' + rightIdx + '"]');

        if (!$leftCell.length || !$rightCell.length) return;

        isDragging = true;
        startX = e.clientX;
        startLeftWidth = $leftCell.width();
        startRightWidth = $rightCell.width();

        $('body').addClass('sit-resize-active');
        $activeHandle.addClass('sit-resizing');
    });

    $(document).on('mousemove.sitResize', function(e) {
        if (!isDragging) return;

        var dx = e.clientX - startX;
        var rowWidth = $activeRow.width();
        var handleWidths = $activeRow.find('.sit-resize-handle').length * 8;
        var availableWidth = rowWidth - handleWidths;

        var newLeftWidth = startLeftWidth + dx;
        var newRightWidth = startRightWidth - dx;

        // Enforce minimum widths
        var minPx = (MIN_PANEL_WIDTH_PCT / 100) * availableWidth;
        if (newLeftWidth < minPx) {
            newLeftWidth = minPx;
            newRightWidth = startLeftWidth + startRightWidth - minPx;
        }
        if (newRightWidth < minPx) {
            newRightWidth = minPx;
            newLeftWidth = startLeftWidth + startRightWidth - minPx;
        }

        // Convert to percentages
        var leftPct = (newLeftWidth / rowWidth) * 100;
        var rightPct = (newRightWidth / rowWidth) * 100;

        $leftCell.css('width', leftPct + '%');
        $rightCell.css('width', rightPct + '%');
    });

    $(document).on('mouseup.sitResize', function() {
        if (!isDragging) return;

        isDragging = false;
        $('body').removeClass('sit-resize-active');
        if ($activeHandle) $activeHandle.removeClass('sit-resizing');

        // Save all cell widths for this row
        if ($activeRow) {
            var rowId = $activeRow.attr('data-sit-row-id');
            var rowWidth = $activeRow.width();
            var cellWidths = {};

            $activeRow.find('[data-sit-cell-index]').each(function() {
                var $cell = $(this);
                var idx = parseInt($cell.attr('data-sit-cell-index'), 10);
                cellWidths[idx] = ($cell.width() / rowWidth) * 100;
            });

            savedSizes[rowId] = cellWidths;
            saveSizes(savedSizes);
        }

        // Trigger resize for chart re-rendering
        setTimeout(function() { $(window).trigger('resize'); }, 100);

        $activeHandle = null;
        $leftCell = null;
        $rightCell = null;
        $activeRow = null;
    });

    // =============================================
    // Reset button
    // =============================================

    var $resetBtn = $('<button class="sit-resize-reset-btn" title="Reset panel sizes to default">')
        .html('\u21BA Reset Layout');

    $resetBtn.on('click', function() {
        // Remove saved sizes
        savedSizes = {};
        saveSizes(savedSizes);

        // Reset all cells to equal widths
        $rows.each(function() {
            var $row = $(this);
            var $cells = $row.find('[data-sit-cell-index]');
            if ($cells.length < 2) return;

            var equalWidth = 100 / $cells.length;
            $cells.each(function() {
                $(this).css('width', equalWidth + '%');
            });
        });

        setTimeout(function() { $(window).trigger('resize'); }, 100);
    });

    // Insert reset button
    var $header = $('.dashboard-header');
    if ($header.length) {
        var $titleArea = $header.find('.dashboard-header-title, h2').first().parent();
        if ($titleArea.length) {
            $resetBtn.css({ float: 'right', marginTop: '10px' });
            $titleArea.append($resetBtn);
        } else {
            $header.append($resetBtn);
        }
    }

    // Listen for external reset
    $(document).on('sit:reset-panel-sizes', function() {
        $resetBtn.trigger('click');
    });

    console.log('[SIT] Drag Resize Panels loaded.');
});
