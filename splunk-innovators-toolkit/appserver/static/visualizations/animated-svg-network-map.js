/**
 * Splunk Innovators Toolkit - Animated SVG Network Map
 * Interactive SVG network topology visualization with draggable nodes,
 * animated data flow connections, and configurable layouts.
 *
 * Version: 1.0.0
 *
 * USAGE:
 * 1. Add an HTML panel to your dashboard with a container div:
 *    <html>
 *      <div id="network-map"
 *           data-nodes='[
 *             {"id":"fw1","label":"Firewall","x":100,"y":200,"type":"firewall","status":"healthy"},
 *             {"id":"srv1","label":"Web Server","x":300,"y":100,"type":"server","status":"healthy"},
 *             {"id":"srv2","label":"DB Server","x":300,"y":300,"type":"database","status":"warning"},
 *             {"id":"lb1","label":"Load Balancer","x":500,"y":200,"type":"loadbalancer","status":"healthy"}
 *           ]'
 *           data-connections='[
 *             {"from":"fw1","to":"srv1","bandwidth":"high"},
 *             {"from":"fw1","to":"srv2","bandwidth":"low"},
 *             {"from":"srv1","to":"lb1","bandwidth":"medium"},
 *             {"from":"srv2","to":"lb1","bandwidth":"medium"}
 *           ]'
 *           style="width:100%;height:500px;">
 *      </div>
 *    </html>
 *
 * 2. Reference this script in your dashboard:
 *    <dashboard script="splunk-innovators-toolkit:visualizations/animated-svg-network-map.js">
 *
 * 3. Or bind to Splunk search results by adding data-search-id attribute:
 *    <div id="network-map" data-search-id="myNetworkSearch"></div>
 *    The search should return fields: source_id, source_label, source_type, source_x, source_y,
 *    dest_id, dest_label, dest_type, dest_x, dest_y, bandwidth, source_status, dest_status
 *
 * Node types: server, firewall, database, loadbalancer, cloud, user, switch, router, generic
 * Status values: healthy (green), warning (yellow), critical (red), unknown (gray)
 * Bandwidth values: high, medium, low (controls animation speed and line thickness)
 */

require([
    'jquery'
], function($) {
    var mvc = null;
    try { mvc = require('splunkjs/mvc'); } catch(e) {}
    'use strict';

    // ========================================
    // Configuration & Color Palette
    // ========================================

    var CONFIG = {
        nodeRadius: 28,
        labelOffset: 42,
        dotRadius: 3,
        dotCount: 3,
        animationSpeed: { high: 1.5, medium: 3, low: 6 },
        lineWidth: { high: 3, medium: 2, low: 1.5 },
        colors: {
            background: '#111215',
            gridLine: 'rgba(255,255,255,0.03)',
            nodeFill: '#1F2527',
            nodeStroke: '#3C444D',
            nodeStrokeHover: '#FD1875',
            labelColor: '#A0A0A0',
            labelColorHover: '#FFFFFF',
            connectionLine: 'rgba(255,255,255,0.15)',
            healthy: '#5CC05C',
            warning: '#F7B500',
            critical: '#DC3545',
            unknown: '#6C757D',
            dotHigh: '#FD1875',
            dotMedium: '#17A2B8',
            dotLow: '#6C757D',
            tooltipBg: '#2B3033',
            tooltipBorder: '#3C444D',
            tooltipText: '#FFFFFF'
        }
    };

    // ========================================
    // SVG Icon Paths (node type icons)
    // ========================================

    var ICONS = {
        server: 'M-12,-8 L12,-8 L12,8 L-12,8 Z M-12,-2 L12,-2 M-8,-5 L-4,-5 M-8,2 L8,2 M8,5 L8,5',
        firewall: 'M-10,-12 L10,-12 L10,12 L-10,12 Z M-10,-4 L10,-4 M-10,4 L10,4 M-3,-12 L-3,12 M3,-12 L3,12',
        database: 'M-10,-10 Q-10,-14 0,-14 Q10,-14 10,-10 L10,10 Q10,14 0,14 Q-10,14 -10,10 Z M-10,-10 Q-10,-6 0,-6 Q10,-6 10,-10 M-10,-2 Q-10,2 0,2 Q10,2 10,-2',
        loadbalancer: 'M0,-14 L14,0 L0,14 L-14,0 Z M0,-6 L0,6 M-6,0 L6,0',
        cloud: 'M-6,4 Q-14,4 -14,-2 Q-14,-8 -8,-8 Q-6,-14 0,-14 Q8,-14 10,-8 Q14,-8 14,-2 Q14,4 8,4 Z',
        user: 'M0,-10 Q6,-10 6,-4 Q6,2 0,2 Q-6,2 -6,-4 Q-6,-10 0,-10 Z M-12,14 Q-12,6 0,6 Q12,6 12,14',
        'switch': 'M-12,-8 L12,-8 L12,8 L-12,8 Z M-8,-3 L-8,3 M-3,-3 L-3,3 M3,-3 L3,3 M8,-3 L8,3',
        router: 'M0,-14 L14,0 L0,14 L-14,0 Z M-4,-4 L4,4 M4,-4 L-4,4',
        generic: 'M-10,-10 L10,-10 L10,10 L-10,10 Z M-6,-6 L6,-6 L6,6 L-6,6 Z'
    };

    // ========================================
    // Network Map Class
    // ========================================

    function NetworkMap(container, nodesData, connectionsData) {
        this.container = $(container);
        this.nodes = nodesData || [];
        this.connections = connectionsData || [];
        this.svgNS = 'http://www.w3.org/2000/svg';
        this.dragTarget = null;
        this.dragOffset = { x: 0, y: 0 };
        this.animationFrameId = null;
        this.dots = [];
        this.init();
    }

    NetworkMap.prototype.init = function() {
        var width = this.container.width() || 800;
        var height = this.container.height() || 500;

        // Create SVG element
        this.svg = document.createElementNS(this.svgNS, 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        this.svg.style.background = CONFIG.colors.background;
        this.svg.style.borderRadius = '8px';
        this.svg.style.cursor = 'default';
        this.svg.style.userSelect = 'none';

        // Defs for filters and gradients
        var defs = document.createElementNS(this.svgNS, 'defs');

        // Glow filter
        var glowFilter = this._createGlowFilter('nodeGlow', CONFIG.colors.nodeStrokeHover, 6);
        defs.appendChild(glowFilter);

        // Status glow filters
        ['healthy', 'warning', 'critical'].forEach(function(status) {
            var f = this._createGlowFilter('glow-' + status, CONFIG.colors[status], 4);
            defs.appendChild(f);
        }.bind(this));

        // Dot glow filters
        ['High', 'Medium', 'Low'].forEach(function(bw) {
            var key = 'dot' + bw;
            var f = this._createGlowFilter('dotGlow-' + bw.toLowerCase(), CONFIG.colors[key], 5);
            defs.appendChild(f);
        }.bind(this));

        this.svg.appendChild(defs);

        // Draw grid
        this._drawGrid(width, height);

        // Connection layer (behind nodes)
        this.connectionLayer = document.createElementNS(this.svgNS, 'g');
        this.connectionLayer.setAttribute('class', 'sit-network-connections');
        this.svg.appendChild(this.connectionLayer);

        // Dot layer (animated dots on connections)
        this.dotLayer = document.createElementNS(this.svgNS, 'g');
        this.dotLayer.setAttribute('class', 'sit-network-dots');
        this.svg.appendChild(this.dotLayer);

        // Node layer (on top)
        this.nodeLayer = document.createElementNS(this.svgNS, 'g');
        this.nodeLayer.setAttribute('class', 'sit-network-nodes');
        this.svg.appendChild(this.nodeLayer);

        // Tooltip
        this.tooltip = this._createTooltip();
        this.svg.appendChild(this.tooltip);

        // Build visualization
        this._drawConnections();
        this._drawNodes();
        this._createAnimatedDots();

        // Mount
        this.container.empty().append(this.svg);

        // Bind drag events
        this._bindDragEvents();

        // Start animation
        this._animate();
    };

    NetworkMap.prototype._createGlowFilter = function(id, color, stdDev) {
        var filter = document.createElementNS(this.svgNS, 'filter');
        filter.setAttribute('id', id);
        filter.setAttribute('x', '-50%');
        filter.setAttribute('y', '-50%');
        filter.setAttribute('width', '200%');
        filter.setAttribute('height', '200%');

        var feFlood = document.createElementNS(this.svgNS, 'feFlood');
        feFlood.setAttribute('flood-color', color);
        feFlood.setAttribute('flood-opacity', '0.6');
        feFlood.setAttribute('result', 'flood');

        var feComposite = document.createElementNS(this.svgNS, 'feComposite');
        feComposite.setAttribute('in', 'flood');
        feComposite.setAttribute('in2', 'SourceGraphic');
        feComposite.setAttribute('operator', 'in');
        feComposite.setAttribute('result', 'mask');

        var feGaussian = document.createElementNS(this.svgNS, 'feGaussianBlur');
        feGaussian.setAttribute('in', 'mask');
        feGaussian.setAttribute('stdDeviation', stdDev);
        feGaussian.setAttribute('result', 'blur');

        var feMerge = document.createElementNS(this.svgNS, 'feMerge');
        var n1 = document.createElementNS(this.svgNS, 'feMergeNode');
        n1.setAttribute('in', 'blur');
        var n2 = document.createElementNS(this.svgNS, 'feMergeNode');
        n2.setAttribute('in', 'SourceGraphic');
        feMerge.appendChild(n1);
        feMerge.appendChild(n2);

        filter.appendChild(feFlood);
        filter.appendChild(feComposite);
        filter.appendChild(feGaussian);
        filter.appendChild(feMerge);

        return filter;
    };

    NetworkMap.prototype._drawGrid = function(width, height) {
        var gridGroup = document.createElementNS(this.svgNS, 'g');
        gridGroup.setAttribute('class', 'sit-network-grid');
        var spacing = 40;

        for (var x = 0; x <= width; x += spacing) {
            var line = document.createElementNS(this.svgNS, 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', height);
            line.setAttribute('stroke', CONFIG.colors.gridLine);
            line.setAttribute('stroke-width', '1');
            gridGroup.appendChild(line);
        }

        for (var y = 0; y <= height; y += spacing) {
            var hline = document.createElementNS(this.svgNS, 'line');
            hline.setAttribute('x1', 0);
            hline.setAttribute('y1', y);
            hline.setAttribute('x2', width);
            hline.setAttribute('y2', y);
            hline.setAttribute('stroke', CONFIG.colors.gridLine);
            hline.setAttribute('stroke-width', '1');
            gridGroup.appendChild(hline);
        }

        this.svg.appendChild(gridGroup);
    };

    NetworkMap.prototype._drawConnections = function() {
        var self = this;
        var nodeMap = {};
        this.nodes.forEach(function(n) { nodeMap[n.id] = n; });
        this.connectionElements = [];

        this.connections.forEach(function(conn) {
            var from = nodeMap[conn.from];
            var to = nodeMap[conn.to];
            if (!from || !to) return;

            var bw = conn.bandwidth || 'medium';
            var line = document.createElementNS(self.svgNS, 'line');
            line.setAttribute('x1', from.x);
            line.setAttribute('y1', from.y);
            line.setAttribute('x2', to.x);
            line.setAttribute('y2', to.y);
            line.setAttribute('stroke', CONFIG.colors.connectionLine);
            line.setAttribute('stroke-width', CONFIG.lineWidth[bw] || 2);
            line.setAttribute('stroke-dasharray', bw === 'low' ? '6,4' : 'none');
            line.setAttribute('data-from', conn.from);
            line.setAttribute('data-to', conn.to);
            self.connectionLayer.appendChild(line);
            self.connectionElements.push({ el: line, from: conn.from, to: conn.to });
        });
    };

    NetworkMap.prototype._drawNodes = function() {
        var self = this;

        this.nodes.forEach(function(node) {
            var group = document.createElementNS(self.svgNS, 'g');
            group.setAttribute('class', 'sit-network-node');
            group.setAttribute('data-id', node.id);
            group.setAttribute('transform', 'translate(' + node.x + ',' + node.y + ')');
            group.style.cursor = 'grab';

            // Status color ring
            var statusColor = CONFIG.colors[node.status] || CONFIG.colors.unknown;

            // Outer ring (status indicator)
            var outerRing = document.createElementNS(self.svgNS, 'circle');
            outerRing.setAttribute('r', CONFIG.nodeRadius + 4);
            outerRing.setAttribute('fill', 'none');
            outerRing.setAttribute('stroke', statusColor);
            outerRing.setAttribute('stroke-width', '2');
            outerRing.setAttribute('stroke-opacity', '0.5');
            outerRing.setAttribute('filter', 'url(#glow-' + (node.status || 'unknown') + ')');
            group.appendChild(outerRing);

            // Node background circle
            var circle = document.createElementNS(self.svgNS, 'circle');
            circle.setAttribute('r', CONFIG.nodeRadius);
            circle.setAttribute('fill', CONFIG.colors.nodeFill);
            circle.setAttribute('stroke', CONFIG.colors.nodeStroke);
            circle.setAttribute('stroke-width', '2');
            group.appendChild(circle);

            // Node icon
            var iconPath = ICONS[node.type] || ICONS.generic;
            var icon = document.createElementNS(self.svgNS, 'path');
            icon.setAttribute('d', iconPath);
            icon.setAttribute('fill', 'none');
            icon.setAttribute('stroke', statusColor);
            icon.setAttribute('stroke-width', '1.5');
            icon.setAttribute('stroke-linecap', 'round');
            icon.setAttribute('stroke-linejoin', 'round');
            group.appendChild(icon);

            // Label
            var label = document.createElementNS(self.svgNS, 'text');
            label.setAttribute('y', CONFIG.labelOffset);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('fill', CONFIG.colors.labelColor);
            label.setAttribute('font-family', 'Splunk Platform Sans, Arial, sans-serif');
            label.setAttribute('font-size', '11');
            label.setAttribute('font-weight', '500');
            label.textContent = node.label || node.id;
            group.appendChild(label);

            // Small status dot below label
            var statusDot = document.createElementNS(self.svgNS, 'circle');
            statusDot.setAttribute('cy', CONFIG.labelOffset + 12);
            statusDot.setAttribute('r', 3);
            statusDot.setAttribute('fill', statusColor);
            group.appendChild(statusDot);

            // Hover events
            $(group).on('mouseenter', function() {
                circle.setAttribute('stroke', CONFIG.colors.nodeStrokeHover);
                circle.setAttribute('stroke-width', '3');
                group.setAttribute('filter', 'url(#nodeGlow)');
                label.setAttribute('fill', CONFIG.colors.labelColorHover);
                self._showTooltip(node);
            }).on('mouseleave', function() {
                circle.setAttribute('stroke', CONFIG.colors.nodeStroke);
                circle.setAttribute('stroke-width', '2');
                group.removeAttribute('filter');
                label.setAttribute('fill', CONFIG.colors.labelColor);
                self._hideTooltip();
            });

            node._group = group;
            self.nodeLayer.appendChild(group);
        });
    };

    NetworkMap.prototype._createAnimatedDots = function() {
        var self = this;
        var nodeMap = {};
        this.nodes.forEach(function(n) { nodeMap[n.id] = n; });

        this.connections.forEach(function(conn) {
            var from = nodeMap[conn.from];
            var to = nodeMap[conn.to];
            if (!from || !to) return;

            var bw = conn.bandwidth || 'medium';
            var colorKey = 'dot' + bw.charAt(0).toUpperCase() + bw.slice(1);
            var dotColor = CONFIG.colors[colorKey] || CONFIG.colors.dotMedium;
            var speed = CONFIG.animationSpeed[bw] || 3;

            for (var i = 0; i < CONFIG.dotCount; i++) {
                var dot = document.createElementNS(self.svgNS, 'circle');
                dot.setAttribute('r', CONFIG.dotRadius);
                dot.setAttribute('fill', dotColor);
                dot.setAttribute('filter', 'url(#dotGlow-' + bw + ')');
                self.dotLayer.appendChild(dot);

                self.dots.push({
                    el: dot,
                    fromId: conn.from,
                    toId: conn.to,
                    progress: i / CONFIG.dotCount,
                    speed: speed
                });
            }
        });
    };

    NetworkMap.prototype._animate = function() {
        var self = this;
        var nodeMap = {};
        this.nodes.forEach(function(n) { nodeMap[n.id] = n; });

        var lastTime = performance.now();

        function frame(currentTime) {
            var delta = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            self.dots.forEach(function(dot) {
                dot.progress += delta / dot.speed;
                if (dot.progress > 1) dot.progress -= 1;

                var from = nodeMap[dot.fromId];
                var to = nodeMap[dot.toId];
                if (!from || !to) return;

                var t = dot.progress;
                var x = from.x + (to.x - from.x) * t;
                var y = from.y + (to.y - from.y) * t;

                dot.el.setAttribute('cx', x);
                dot.el.setAttribute('cy', y);

                // Fade near endpoints
                var alpha = 1;
                if (t < 0.1) alpha = t / 0.1;
                else if (t > 0.9) alpha = (1 - t) / 0.1;
                dot.el.setAttribute('opacity', alpha);
            });

            self.animationFrameId = requestAnimationFrame(frame);
        }

        this.animationFrameId = requestAnimationFrame(frame);
    };

    NetworkMap.prototype._createTooltip = function() {
        var group = document.createElementNS(this.svgNS, 'g');
        group.setAttribute('class', 'sit-network-tooltip');
        group.style.display = 'none';
        group.style.pointerEvents = 'none';

        var rect = document.createElementNS(this.svgNS, 'rect');
        rect.setAttribute('rx', '6');
        rect.setAttribute('ry', '6');
        rect.setAttribute('fill', CONFIG.colors.tooltipBg);
        rect.setAttribute('stroke', CONFIG.colors.tooltipBorder);
        rect.setAttribute('stroke-width', '1');
        group.appendChild(rect);

        var text1 = document.createElementNS(this.svgNS, 'text');
        text1.setAttribute('fill', CONFIG.colors.tooltipText);
        text1.setAttribute('font-family', 'Splunk Platform Sans, Arial, sans-serif');
        text1.setAttribute('font-size', '12');
        text1.setAttribute('font-weight', '600');
        group.appendChild(text1);

        var text2 = document.createElementNS(this.svgNS, 'text');
        text2.setAttribute('fill', CONFIG.colors.labelColor);
        text2.setAttribute('font-family', 'Splunk Platform Sans, Arial, sans-serif');
        text2.setAttribute('font-size', '11');
        group.appendChild(text2);

        this._tooltipRect = rect;
        this._tooltipTitle = text1;
        this._tooltipDetail = text2;

        return group;
    };

    NetworkMap.prototype._showTooltip = function(node) {
        var title = node.label || node.id;
        var detail = 'Type: ' + (node.type || 'generic') + '  |  Status: ' + (node.status || 'unknown');

        this._tooltipTitle.textContent = title;
        this._tooltipTitle.setAttribute('x', node.x + 50);
        this._tooltipTitle.setAttribute('y', node.y - 18);

        this._tooltipDetail.textContent = detail;
        this._tooltipDetail.setAttribute('x', node.x + 50);
        this._tooltipDetail.setAttribute('y', node.y);

        var maxLen = Math.max(title.length, detail.length);
        var w = maxLen * 7 + 20;
        this._tooltipRect.setAttribute('x', node.x + 44);
        this._tooltipRect.setAttribute('y', node.y - 34);
        this._tooltipRect.setAttribute('width', w);
        this._tooltipRect.setAttribute('height', 44);

        this.tooltip.style.display = '';
    };

    NetworkMap.prototype._hideTooltip = function() {
        this.tooltip.style.display = 'none';
    };

    NetworkMap.prototype._bindDragEvents = function() {
        var self = this;
        var svg = this.svg;
        var nodeMap = {};
        this.nodes.forEach(function(n) { nodeMap[n.id] = n; });

        $(svg).on('mousedown', '.sit-network-node', function(e) {
            e.preventDefault();
            var nodeId = $(this).attr('data-id');
            var node = nodeMap[nodeId];
            if (!node) return;

            var pt = self._getSVGPoint(e);
            self.dragTarget = node;
            self.dragOffset.x = pt.x - node.x;
            self.dragOffset.y = pt.y - node.y;
            this.style.cursor = 'grabbing';
        });

        $(svg).on('mousemove', function(e) {
            if (!self.dragTarget) return;
            e.preventDefault();
            var pt = self._getSVGPoint(e);
            self.dragTarget.x = pt.x - self.dragOffset.x;
            self.dragTarget.y = pt.y - self.dragOffset.y;
            self._updateNodePosition(self.dragTarget);
        });

        $(svg).on('mouseup mouseleave', function() {
            if (self.dragTarget) {
                var group = self.dragTarget._group;
                if (group) group.style.cursor = 'grab';
                self.dragTarget = null;
            }
        });
    };

    NetworkMap.prototype._getSVGPoint = function(e) {
        var pt = this.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(this.svg.getScreenCTM().inverse());
    };

    NetworkMap.prototype._updateNodePosition = function(node) {
        if (node._group) {
            node._group.setAttribute('transform', 'translate(' + node.x + ',' + node.y + ')');
        }
        // Update connections
        this.connectionElements.forEach(function(conn) {
            if (conn.from === node.id) {
                conn.el.setAttribute('x1', node.x);
                conn.el.setAttribute('y1', node.y);
            }
            if (conn.to === node.id) {
                conn.el.setAttribute('x2', node.x);
                conn.el.setAttribute('y2', node.y);
            }
        });
    };

    NetworkMap.prototype.destroy = function() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.container.empty();
    };

    // ========================================
    // Initialization
    // ========================================

    function initNetworkMaps() {
        $('[id*="network-map"], [data-viz="network-map"]').each(function() {
            var $el = $(this);
            if ($el.data('sit-network-initialized')) return;
            $el.data('sit-network-initialized', true);

            var nodesData, connectionsData;

            // Try parsing data attributes
            try {
                nodesData = JSON.parse($el.attr('data-nodes') || '[]');
                connectionsData = JSON.parse($el.attr('data-connections') || '[]');
            } catch(e) {
                console.error('[SIT Network Map] Failed to parse node/connection data:', e);
                return;
            }

            // If search binding is requested
            var searchId = $el.attr('data-search-id');
            if (searchId && mvc) {
                try {
                    var searchManager = mvc.Components.get(searchId);
                    if (searchManager) {
                        var results = searchManager.data('results', { count: 0 });
                        results.on('data', function() {
                            var rows = results.data().rows;
                            var fields = results.data().fields;
                            var parsed = _parseSearchResults(rows, fields);
                            new NetworkMap($el[0], parsed.nodes, parsed.connections);
                        });
                        return;
                    }
                } catch(e) {
                    console.warn('[SIT Network Map] Could not bind to search:', searchId, e);
                }
            }

            if (nodesData.length > 0) {
                new NetworkMap($el[0], nodesData, connectionsData);
            }
        });
    }

    function _parseSearchResults(rows, fields) {
        var fi = {};
        fields.forEach(function(f, i) { fi[f] = i; });
        var nodeMap = {};
        var connections = [];

        rows.forEach(function(row) {
            var sId = row[fi['source_id']];
            var dId = row[fi['dest_id']];

            if (sId && !nodeMap[sId]) {
                nodeMap[sId] = {
                    id: sId,
                    label: row[fi['source_label']] || sId,
                    type: row[fi['source_type']] || 'generic',
                    x: parseFloat(row[fi['source_x']]) || Math.random() * 600 + 100,
                    y: parseFloat(row[fi['source_y']]) || Math.random() * 400 + 50,
                    status: row[fi['source_status']] || 'unknown'
                };
            }

            if (dId && !nodeMap[dId]) {
                nodeMap[dId] = {
                    id: dId,
                    label: row[fi['dest_label']] || dId,
                    type: row[fi['dest_type']] || 'generic',
                    x: parseFloat(row[fi['dest_x']]) || Math.random() * 600 + 100,
                    y: parseFloat(row[fi['dest_y']]) || Math.random() * 400 + 50,
                    status: row[fi['dest_status']] || 'unknown'
                };
            }

            if (sId && dId) {
                connections.push({
                    from: sId,
                    to: dId,
                    bandwidth: row[fi['bandwidth']] || 'medium'
                });
            }
        });

        return { nodes: Object.values(nodeMap), connections: connections };
    }

    // Use MutationObserver to handle async rendering
    var observer = new MutationObserver(function() {
        initNetworkMaps();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also run on initial load
    initNetworkMaps();

    console.log('[SIT] Animated SVG Network Map loaded');
});
