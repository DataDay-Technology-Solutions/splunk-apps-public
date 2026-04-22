/**
 * Splunk Innovators Toolkit - Kanban Board
 * Drag-and-drop Kanban board layout for incidents, tasks, or workflow items.
 * Cards can be dragged between columns. Fully styled inline.
 *
 * Version: 1.0.0
 *
 * USAGE:
 * 1. Add an HTML panel:
 *    <html>
 *      <div id="kanban-board"
 *           data-columns='["New","In Progress","Review","Done"]'
 *           data-cards='[
 *             {"id":"INC-001","title":"Login Failure","description":"Users unable to login via SSO","column":"New","priority":"critical","assignee":"John"},
 *             {"id":"INC-002","title":"Slow Dashboard","description":"Dashboard load time exceeds 30s","column":"In Progress","priority":"high","assignee":"Jane"},
 *             {"id":"INC-003","title":"Log Gap","description":"Missing logs from 02:00-03:00","column":"Review","priority":"medium","assignee":"Bob"},
 *             {"id":"INC-004","title":"Alert Storm","description":"False positive alerts resolved","column":"Done","priority":"low","assignee":"Alice"}
 *           ]'
 *           style="width:100%;min-height:400px;">
 *      </div>
 *    </html>
 *
 * 2. Reference:
 *    <dashboard script="splunk-innovators-toolkit:visualizations/kanban-board.js">
 *
 * 3. Search binding: data-search-id. Fields: id, title, description, column, priority, assignee
 *
 * Priority values: critical (red), high (orange), medium (yellow), low (green), info (blue)
 */

require([
    'jquery'
], function($) {
    var mvc = null;
    try { mvc = require('splunkjs/mvc'); } catch(e) {}
    'use strict';

    // ========================================
    // Configuration
    // ========================================

    var PRIORITY_COLORS = {
        critical: { bg: 'rgba(220,53,69,0.15)',   border: '#DC3545', dot: '#DC3545', label: 'Critical' },
        high:     { bg: 'rgba(253,122,43,0.15)',   border: '#FD7A2B', dot: '#FD7A2B', label: 'High' },
        medium:   { bg: 'rgba(247,181,0,0.15)',    border: '#F7B500', dot: '#F7B500', label: 'Medium' },
        low:      { bg: 'rgba(92,192,92,0.15)',    border: '#5CC05C', dot: '#5CC05C', label: 'Low' },
        info:     { bg: 'rgba(23,162,184,0.15)',    border: '#17A2B8', dot: '#17A2B8', label: 'Info' }
    };

    var COLUMN_HEADER_COLORS = {
        'New':         '#FD1875',
        'In Progress': '#17A2B8',
        'Review':      '#F7B500',
        'Done':        '#5CC05C',
        'Blocked':     '#DC3545',
        'Backlog':     '#6C757D'
    };

    // ========================================
    // Styles
    // ========================================

    var STYLES = [
        '.sit-kanban { display: flex; gap: 12px; padding: 16px; background: #111215; border-radius: 8px; overflow-x: auto; font-family: "Splunk Platform Sans", Arial, sans-serif; min-height: 300px; }',
        '.sit-kanban-column { flex: 1; min-width: 220px; max-width: 320px; background: #171D21; border-radius: 8px; display: flex; flex-direction: column; }',
        '.sit-kanban-column-header { padding: 12px 14px; border-bottom: 1px solid #2B3033; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }',
        '.sit-kanban-column-title { font-size: 13px; font-weight: 600; color: #FFFFFF; display: flex; align-items: center; gap: 8px; }',
        '.sit-kanban-column-count { font-size: 11px; color: #6C757D; background: #2B3033; padding: 2px 8px; border-radius: 10px; }',
        '.sit-kanban-column-body { flex: 1; padding: 8px; overflow-y: auto; min-height: 80px; transition: background 0.2s ease; }',
        '.sit-kanban-column-body.drag-over { background: rgba(253,24,117,0.06); }',
        '.sit-kanban-card { background: #1F2527; border: 1px solid #2B3033; border-radius: 6px; padding: 12px; margin-bottom: 8px; cursor: grab; transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; }',
        '.sit-kanban-card:hover { border-color: #3C444D; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transform: translateY(-1px); }',
        '.sit-kanban-card.dragging { opacity: 0.5; transform: rotate(2deg) scale(0.98); cursor: grabbing; }',
        '.sit-kanban-card-id { font-size: 10px; color: #6C757D; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px; }',
        '.sit-kanban-card-title { font-size: 13px; font-weight: 500; color: #FFFFFF; margin-bottom: 6px; line-height: 1.3; }',
        '.sit-kanban-card-desc { font-size: 11px; color: #A0A0A0; line-height: 1.4; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }',
        '.sit-kanban-card-footer { display: flex; justify-content: space-between; align-items: center; }',
        '.sit-kanban-card-priority { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.05em; }',
        '.sit-kanban-card-assignee { font-size: 11px; color: #6C757D; display: flex; align-items: center; gap: 4px; }',
        '.sit-kanban-card-avatar { width: 20px; height: 20px; border-radius: 50%; background: #3C444D; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #FFFFFF; font-weight: 600; }',
        '.sit-kanban-header-bar { width: 3px; height: 14px; border-radius: 2px; flex-shrink: 0; }'
    ].join('\n');

    if (!document.getElementById('sit-kanban-styles')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'sit-kanban-styles';
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);
    }

    // ========================================
    // KanbanBoard Class
    // ========================================

    function KanbanBoard(container, columns, cards) {
        this.$container = $(container);
        this.columns = columns || ['New', 'In Progress', 'Done'];
        this.cards = cards || [];
        this.draggedCard = null;
        this.init();
    }

    KanbanBoard.prototype.init = function() {
        var self = this;

        this.$board = $('<div class="sit-kanban"></div>');

        this.columns.forEach(function(colName) {
            var colCards = self.cards.filter(function(c) { return c.column === colName; });
            var headerColor = COLUMN_HEADER_COLORS[colName] || '#FD1875';

            var $column = $('<div class="sit-kanban-column"></div>');

            // Header
            var $header = $('<div class="sit-kanban-column-header"></div>');
            var $title = $('<div class="sit-kanban-column-title"></div>');
            $title.append($('<div class="sit-kanban-header-bar"></div>').css('background', headerColor));
            $title.append($('<span></span>').text(colName));
            $header.append($title);
            $header.append($('<span class="sit-kanban-column-count"></span>').text(colCards.length));
            $column.append($header);

            // Body
            var $body = $('<div class="sit-kanban-column-body"></div>');
            $body.attr('data-column', colName);

            colCards.forEach(function(card) {
                var $card = self._createCardElement(card);
                $body.append($card);
            });

            // Drop zone events
            $body.on('dragover', function(e) {
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'move';
                $body.addClass('drag-over');
            }).on('dragleave', function() {
                $body.removeClass('drag-over');
            }).on('drop', function(e) {
                e.preventDefault();
                $body.removeClass('drag-over');
                if (self.draggedCard) {
                    var cardId = self.draggedCard.attr('data-card-id');
                    var newCol = $body.attr('data-column');

                    // Update card data
                    self.cards.forEach(function(c) {
                        if (c.id === cardId) c.column = newCol;
                    });

                    // Move DOM element
                    $body.append(self.draggedCard);
                    self.draggedCard.removeClass('dragging');
                    self.draggedCard = null;

                    // Update counts
                    self._updateCounts();
                }
            });

            $column.append($body);
            self.$board.append($column);
        });

        this.$container.empty().append(this.$board);
    };

    KanbanBoard.prototype._createCardElement = function(card) {
        var self = this;
        var priority = PRIORITY_COLORS[card.priority] || PRIORITY_COLORS.info;

        var $card = $('<div class="sit-kanban-card" draggable="true"></div>');
        $card.attr('data-card-id', card.id);

        // Left border accent
        $card.css('borderLeft', '3px solid ' + priority.border);

        // Card ID
        $card.append($('<div class="sit-kanban-card-id"></div>').text(card.id));

        // Title
        $card.append($('<div class="sit-kanban-card-title"></div>').text(card.title || 'Untitled'));

        // Description
        if (card.description) {
            $card.append($('<div class="sit-kanban-card-desc"></div>').text(card.description));
        }

        // Footer
        var $footer = $('<div class="sit-kanban-card-footer"></div>');

        // Priority badge
        var $priority = $('<span class="sit-kanban-card-priority"></span>')
            .text(priority.label)
            .css({
                background: priority.bg,
                color: priority.dot
            });
        $footer.append($priority);

        // Assignee
        if (card.assignee) {
            var initials = card.assignee.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().substring(0, 2);
            var $assignee = $('<div class="sit-kanban-card-assignee"></div>');
            $assignee.append($('<div class="sit-kanban-card-avatar"></div>').text(initials));
            $assignee.append($('<span></span>').text(card.assignee));
            $footer.append($assignee);
        }

        $card.append($footer);

        // Drag events
        $card.on('dragstart', function(e) {
            self.draggedCard = $card;
            $card.addClass('dragging');
            e.originalEvent.dataTransfer.effectAllowed = 'move';
            e.originalEvent.dataTransfer.setData('text/plain', card.id);
        }).on('dragend', function() {
            $card.removeClass('dragging');
            $('.sit-kanban-column-body').removeClass('drag-over');
        });

        return $card;
    };

    KanbanBoard.prototype._updateCounts = function() {
        var self = this;
        this.$board.find('.sit-kanban-column').each(function() {
            var $col = $(this);
            var colName = $col.find('.sit-kanban-column-body').attr('data-column');
            var count = $col.find('.sit-kanban-card').length;
            $col.find('.sit-kanban-column-count').text(count);
        });
    };

    // ========================================
    // Initialization
    // ========================================

    function initKanbanBoards() {
        $('[id*="kanban-board"], [data-viz="kanban-board"]').each(function() {
            var $el = $(this);
            if ($el.data('sit-kanban-initialized')) return;
            $el.data('sit-kanban-initialized', true);

            var columns, cards;
            try {
                columns = JSON.parse($el.attr('data-columns') || '["New","In Progress","Done"]');
            } catch(e) {
                columns = ['New', 'In Progress', 'Done'];
            }
            try {
                cards = JSON.parse($el.attr('data-cards') || '[]');
            } catch(e) {
                console.error('[SIT Kanban] Failed to parse cards:', e);
                cards = [];
            }

            // Search binding
            var searchId = $el.attr('data-search-id');
            if (searchId && mvc) {
                try {
                    var sm = mvc.Components.get(searchId);
                    if (sm) {
                        var results = sm.data('results', { count: 0 });
                        results.on('data', function() {
                            var rows = results.data().rows;
                            var fields = results.data().fields;
                            var fi = {};
                            fields.forEach(function(f, i) { fi[f] = i; });
                            var c = rows.map(function(row) {
                                return {
                                    id: row[fi['id']] || '',
                                    title: row[fi['title']] || '',
                                    description: row[fi['description']] || '',
                                    column: row[fi['column']] || columns[0],
                                    priority: row[fi['priority']] || 'info',
                                    assignee: row[fi['assignee']] || ''
                                };
                            });

                            // Auto-detect columns from data
                            var detectedCols = [];
                            c.forEach(function(card) {
                                if (detectedCols.indexOf(card.column) === -1) detectedCols.push(card.column);
                            });
                            if (detectedCols.length > 0) columns = detectedCols;

                            new KanbanBoard($el[0], columns, c);
                        });
                        return;
                    }
                } catch(e) {
                    console.warn('[SIT Kanban] Could not bind to search:', searchId, e);
                }
            }

            new KanbanBoard($el[0], columns, cards);
        });
    }

    var observer = new MutationObserver(function() { initKanbanBoards(); });
    observer.observe(document.body, { childList: true, subtree: true });
    initKanbanBoards();

    console.log('[SIT] Kanban Board loaded');
});
