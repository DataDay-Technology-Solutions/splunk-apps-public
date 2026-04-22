/**
 * Splunk Innovators Toolkit - Interactive Org Chart
 * Clickable organization/hierarchy chart with tree layout.
 * Nodes expand/collapse with animated transitions.
 * Lines connect parent-child relationships.
 *
 * Version: 1.0.0
 *
 * USAGE:
 * 1. Add an HTML panel:
 *    <html>
 *      <div id="org-chart"
 *           data-tree='{
 *             "id":"ceo","label":"CEO","title":"Chief Executive","status":"active",
 *             "children":[
 *               {"id":"cto","label":"CTO","title":"Chief Technology","status":"active",
 *                 "children":[
 *                   {"id":"dev1","label":"Dev Lead","title":"Development","status":"active","children":[
 *                     {"id":"d1","label":"Dev A","title":"Frontend","status":"active"},
 *                     {"id":"d2","label":"Dev B","title":"Backend","status":"active"}
 *                   ]},
 *                   {"id":"ops1","label":"Ops Lead","title":"Operations","status":"warning"}
 *                 ]
 *               },
 *               {"id":"ciso","label":"CISO","title":"Security","status":"critical",
 *                 "children":[
 *                   {"id":"soc1","label":"SOC Lead","title":"SOC","status":"active"}
 *                 ]
 *               }
 *             ]
 *           }'
 *           style="width:100%;height:500px;overflow:auto;">
 *      </div>
 *    </html>
 *
 * 2. Reference:
 *    <dashboard script="splunk-innovators-toolkit:visualizations/org-chart-interactive.js">
 *
 * Status: active (green), warning (yellow), critical (red), inactive (gray)
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

    var NODE_WIDTH = 160;
    var NODE_HEIGHT = 64;
    var H_GAP = 30;
    var V_GAP = 60;
    var CONNECTOR_RADIUS = 4;

    var STATUS_COLORS = {
        active:   { border: '#5CC05C', glow: 'rgba(92,192,92,0.3)',  dot: '#5CC05C' },
        warning:  { border: '#F7B500', glow: 'rgba(247,181,0,0.3)',  dot: '#F7B500' },
        critical: { border: '#DC3545', glow: 'rgba(220,53,69,0.3)',  dot: '#DC3545' },
        inactive: { border: '#6C757D', glow: 'rgba(108,117,125,0.2)', dot: '#6C757D' }
    };

    // ========================================
    // Styles
    // ========================================

    var STYLES = [
        '.sit-org-wrapper { background: #111215; border-radius: 8px; overflow: auto; position: relative; font-family: "Splunk Platform Sans", Arial, sans-serif; }',
        '.sit-org-canvas { position: relative; margin: 30px; }',
        '.sit-org-svg { position: absolute; top: 0; left: 0; pointer-events: none; }',
        '.sit-org-node { position: absolute; width: ' + NODE_WIDTH + 'px; height: ' + NODE_HEIGHT + 'px; background: #1F2527; border: 1px solid #3C444D; border-radius: 8px; cursor: pointer; display: flex; align-items: center; padding: 0 12px; gap: 10px; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.3s ease; user-select: none; }',
        '.sit-org-node:hover { border-color: #FD1875; box-shadow: 0 4px 16px rgba(253,24,117,0.15); transform: translateY(-2px); z-index: 10; }',
        '.sit-org-node.collapsed .sit-org-expand { transform: rotate(-90deg); }',
        '.sit-org-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }',
        '.sit-org-info { flex: 1; overflow: hidden; }',
        '.sit-org-label { font-size: 12px; font-weight: 600; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
        '.sit-org-title { font-size: 10px; color: #A0A0A0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }',
        '.sit-org-expand { width: 18px; height: 18px; border-radius: 50%; background: #2B3033; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #A0A0A0; flex-shrink: 0; transition: transform 0.3s ease, background 0.2s ease; }',
        '.sit-org-expand:hover { background: #3C444D; color: #FFFFFF; }',
        '.sit-org-children { transition: opacity 0.3s ease, max-height 0.4s ease; overflow: hidden; }',
        '.sit-org-children.hidden { opacity: 0; max-height: 0 !important; pointer-events: none; }'
    ].join('\n');

    if (!document.getElementById('sit-org-styles')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'sit-org-styles';
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);
    }

    // ========================================
    // OrgChart Class
    // ========================================

    function OrgChart(container, treeData) {
        this.$container = $(container);
        this.tree = treeData;
        this.svgNS = 'http://www.w3.org/2000/svg';
        this.collapsedNodes = {};
        this.init();
    }

    OrgChart.prototype.init = function() {
        this.$wrapper = $('<div class="sit-org-wrapper"></div>').css({
            width: '100%',
            height: this.$container.height() || 500
        });

        this.$canvas = $('<div class="sit-org-canvas"></div>');
        this.$wrapper.append(this.$canvas);

        this.$container.empty().append(this.$wrapper);

        this._layout();
    };

    OrgChart.prototype._layout = function() {
        // Compute layout positions (top-down tree)
        this._computeSubtreeWidths(this.tree);
        this._assignPositions(this.tree, 0, 0);

        // Determine canvas size
        var bounds = this._getBounds(this.tree);
        var canvasWidth = bounds.maxX + NODE_WIDTH + 60;
        var canvasHeight = bounds.maxY + NODE_HEIGHT + 60;

        this.$canvas.css({ width: canvasWidth, height: canvasHeight });

        // Clear and redraw
        this.$canvas.empty();

        // SVG for connectors
        this.svg = document.createElementNS(this.svgNS, 'svg');
        this.svg.setAttribute('width', canvasWidth);
        this.svg.setAttribute('height', canvasHeight);
        this.svg.setAttribute('class', 'sit-org-svg');
        this.$canvas.append(this.svg);

        // Draw connectors then nodes
        this._drawConnectors(this.tree);
        this._drawNodes(this.tree);
    };

    OrgChart.prototype._computeSubtreeWidths = function(node) {
        if (!node.children || node.children.length === 0 || this.collapsedNodes[node.id]) {
            node._width = NODE_WIDTH;
            return NODE_WIDTH;
        }

        var totalWidth = 0;
        var self = this;
        node.children.forEach(function(child, i) {
            if (i > 0) totalWidth += H_GAP;
            totalWidth += self._computeSubtreeWidths(child);
        });

        node._width = Math.max(NODE_WIDTH, totalWidth);
        return node._width;
    };

    OrgChart.prototype._assignPositions = function(node, x, depth) {
        // Center this node above its subtree
        node._x = x + (node._width - NODE_WIDTH) / 2;
        node._y = depth * (NODE_HEIGHT + V_GAP);
        node._depth = depth;

        if (!node.children || node.children.length === 0 || this.collapsedNodes[node.id]) return;

        var childX = x;
        var self = this;
        node.children.forEach(function(child, i) {
            if (i > 0) childX += H_GAP;
            self._assignPositions(child, childX, depth + 1);
            childX += child._width;
        });
    };

    OrgChart.prototype._getBounds = function(node) {
        var result = { maxX: node._x, maxY: node._y };
        if (node.children && !this.collapsedNodes[node.id]) {
            var self = this;
            node.children.forEach(function(child) {
                var childBounds = self._getBounds(child);
                result.maxX = Math.max(result.maxX, childBounds.maxX);
                result.maxY = Math.max(result.maxY, childBounds.maxY);
            });
        }
        return result;
    };

    OrgChart.prototype._drawConnectors = function(node) {
        if (!node.children || node.children.length === 0 || this.collapsedNodes[node.id]) return;

        var self = this;
        var parentCx = node._x + NODE_WIDTH / 2;
        var parentBy = node._y + NODE_HEIGHT;

        node.children.forEach(function(child) {
            var childCx = child._x + NODE_WIDTH / 2;
            var childTy = child._y;

            // Draw an elbow connector: parent bottom -> midpoint -> child top
            var midY = parentBy + V_GAP / 2;

            var path = document.createElementNS(self.svgNS, 'path');
            var d = 'M ' + parentCx + ' ' + parentBy +
                    ' L ' + parentCx + ' ' + midY +
                    ' L ' + childCx + ' ' + midY +
                    ' L ' + childCx + ' ' + childTy;
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#3C444D');
            path.setAttribute('stroke-width', '1.5');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            self.svg.appendChild(path);

            // Small dot at connection points
            var dot = document.createElementNS(self.svgNS, 'circle');
            dot.setAttribute('cx', childCx);
            dot.setAttribute('cy', childTy);
            dot.setAttribute('r', CONNECTOR_RADIUS);
            dot.setAttribute('fill', '#3C444D');
            self.svg.appendChild(dot);

            self._drawConnectors(child);
        });
    };

    OrgChart.prototype._drawNodes = function(node) {
        var self = this;
        var status = STATUS_COLORS[node.status] || STATUS_COLORS.inactive;
        var hasChildren = node.children && node.children.length > 0;
        var isCollapsed = this.collapsedNodes[node.id];

        var $node = $('<div class="sit-org-node"></div>').css({
            left: node._x,
            top: node._y,
            borderLeftColor: status.border,
            borderLeftWidth: '3px'
        });
        if (isCollapsed) $node.addClass('collapsed');

        // Status dot
        $node.append($('<div class="sit-org-status-dot"></div>').css('background', status.dot));

        // Info
        var $info = $('<div class="sit-org-info"></div>');
        $info.append($('<div class="sit-org-label"></div>').text(node.label || node.id));
        if (node.title) {
            $info.append($('<div class="sit-org-title"></div>').text(node.title));
        }
        $node.append($info);

        // Expand/collapse button
        if (hasChildren) {
            var childCount = node.children.length;
            var $expand = $('<div class="sit-org-expand"></div>').text(isCollapsed ? '+' + childCount : '\u25BC');
            $expand.on('click', function(e) {
                e.stopPropagation();
                if (self.collapsedNodes[node.id]) {
                    delete self.collapsedNodes[node.id];
                } else {
                    self.collapsedNodes[node.id] = true;
                }
                self._layout();
            });
            $node.append($expand);
        }

        // Click handler for node selection
        $node.on('click', function() {
            $('.sit-org-node').css('boxShadow', '');
            $node.css('boxShadow', '0 0 0 2px ' + status.border + ', 0 4px 16px ' + status.glow);
        });

        this.$canvas.append($node);

        // Draw children
        if (hasChildren && !isCollapsed) {
            node.children.forEach(function(child) {
                self._drawNodes(child);
            });
        }
    };

    // ========================================
    // Initialization
    // ========================================

    function initOrgCharts() {
        $('[id*="org-chart"], [data-viz="org-chart"]').each(function() {
            var $el = $(this);
            if ($el.data('sit-org-initialized')) return;
            $el.data('sit-org-initialized', true);

            var treeData;
            try {
                treeData = JSON.parse($el.attr('data-tree') || 'null');
            } catch(e) {
                console.error('[SIT Org Chart] Failed to parse tree data:', e);
                return;
            }

            if (!treeData) {
                console.warn('[SIT Org Chart] No tree data provided');
                return;
            }

            new OrgChart($el[0], treeData);
        });
    }

    var observer = new MutationObserver(function() { initOrgCharts(); });
    observer.observe(document.body, { childList: true, subtree: true });
    initOrgCharts();

    console.log('[SIT] Interactive Org Chart loaded');
});
