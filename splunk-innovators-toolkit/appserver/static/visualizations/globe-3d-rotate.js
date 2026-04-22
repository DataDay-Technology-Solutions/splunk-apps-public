/**
 * Splunk Innovators Toolkit - 3D Rotating Globe
 * Interactive 3D globe with data points using pure CSS 3D transforms.
 * No WebGL required. Plots geo-coordinates on a rotating sphere.
 *
 * Version: 1.0.0
 *
 * USAGE:
 * 1. Add an HTML panel to your dashboard:
 *    <html>
 *      <div id="globe-3d"
 *           data-points='[
 *             {"lat":37.77,"lon":-122.42,"label":"San Francisco","value":1200,"category":"office"},
 *             {"lat":51.51,"lon":-0.13,"label":"London","value":800,"category":"office"},
 *             {"lat":35.68,"lon":139.69,"label":"Tokyo","value":950,"category":"datacenter"},
 *             {"lat":-33.87,"lon":151.21,"label":"Sydney","value":400,"category":"office"}
 *           ]'
 *           data-radius="180"
 *           data-speed="0.3"
 *           data-auto-rotate="true"
 *           style="width:100%;height:500px;display:flex;justify-content:center;align-items:center;">
 *      </div>
 *    </html>
 *
 * 2. Reference this script:
 *    <dashboard script="splunk-innovators-toolkit:visualizations/globe-3d-rotate.js">
 *
 * 3. Bind to search results with data-search-id. Search should return: lat, lon, label, value, category
 *
 * Categories map to colors: office (pink), datacenter (cyan), cloud (yellow), alert (red)
 */

require([
    'jquery'
], function($) {
    var mvc = null;
    try { mvc = require('splunkjs/mvc'); } catch(e) {}
    'use strict';

    // ========================================
    // Styles injected into page
    // ========================================

    var STYLES = [
        '.sit-globe-container {',
        '  position: relative;',
        '  perspective: 1200px;',
        '  display: flex;',
        '  justify-content: center;',
        '  align-items: center;',
        '  overflow: hidden;',
        '}',
        '.sit-globe-scene {',
        '  position: relative;',
        '  transform-style: preserve-3d;',
        '  transition: none;',
        '}',
        '.sit-globe-sphere {',
        '  position: absolute;',
        '  border-radius: 50%;',
        '  border: 1px solid rgba(253,24,117,0.15);',
        '  background: radial-gradient(ellipse at 30% 30%, rgba(31,37,39,0.9), rgba(17,18,21,0.95));',
        '  box-shadow: inset -20px -20px 60px rgba(0,0,0,0.6), inset 8px 8px 30px rgba(253,24,117,0.05), 0 0 60px rgba(253,24,117,0.08);',
        '}',
        '.sit-globe-meridian {',
        '  position: absolute;',
        '  border-radius: 50%;',
        '  border: 1px solid rgba(255,255,255,0.04);',
        '  transform-style: preserve-3d;',
        '}',
        '.sit-globe-point {',
        '  position: absolute;',
        '  width: 10px;',
        '  height: 10px;',
        '  border-radius: 50%;',
        '  transform-style: preserve-3d;',
        '  cursor: pointer;',
        '  transition: transform 0.2s ease;',
        '}',
        '.sit-globe-point:hover {',
        '  transform: scale(2) !important;',
        '  z-index: 100;',
        '}',
        '.sit-globe-point-inner {',
        '  width: 100%;',
        '  height: 100%;',
        '  border-radius: 50%;',
        '  animation: sit-globe-pulse 2s infinite;',
        '}',
        '.sit-globe-tooltip {',
        '  position: absolute;',
        '  padding: 8px 14px;',
        '  background: #2B3033;',
        '  border: 1px solid #3C444D;',
        '  border-radius: 6px;',
        '  color: #FFFFFF;',
        '  font-family: "Splunk Platform Sans", Arial, sans-serif;',
        '  font-size: 12px;',
        '  pointer-events: none;',
        '  white-space: nowrap;',
        '  z-index: 1000;',
        '  opacity: 0;',
        '  transition: opacity 0.2s ease;',
        '  box-shadow: 0 4px 12px rgba(0,0,0,0.4);',
        '}',
        '.sit-globe-tooltip.visible { opacity: 1; }',
        '.sit-globe-tooltip .sit-globe-tt-label { font-weight: 600; margin-bottom: 2px; }',
        '.sit-globe-tooltip .sit-globe-tt-value { color: #A0A0A0; font-size: 11px; }',
        '.sit-globe-legend {',
        '  position: absolute;',
        '  bottom: 10px;',
        '  right: 10px;',
        '  background: rgba(43,48,51,0.85);',
        '  border: 1px solid #3C444D;',
        '  border-radius: 6px;',
        '  padding: 8px 12px;',
        '  font-family: "Splunk Platform Sans", Arial, sans-serif;',
        '  font-size: 11px;',
        '  color: #A0A0A0;',
        '}',
        '.sit-globe-legend-item {',
        '  display: flex;',
        '  align-items: center;',
        '  gap: 6px;',
        '  margin: 3px 0;',
        '}',
        '.sit-globe-legend-dot {',
        '  width: 8px;',
        '  height: 8px;',
        '  border-radius: 50%;',
        '  flex-shrink: 0;',
        '}',
        '@keyframes sit-globe-pulse {',
        '  0%, 100% { box-shadow: 0 0 4px currentColor, 0 0 8px currentColor; opacity: 0.9; }',
        '  50% { box-shadow: 0 0 8px currentColor, 0 0 16px currentColor; opacity: 1; }',
        '}'
    ].join('\n');

    if (!document.getElementById('sit-globe-styles')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'sit-globe-styles';
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);
    }

    // ========================================
    // Color palette for categories
    // ========================================

    var CATEGORY_COLORS = {
        office: '#FD1875',
        datacenter: '#17A2B8',
        cloud: '#F7B500',
        alert: '#DC3545',
        success: '#5CC05C',
        default: '#FD7A2B'
    };

    // ========================================
    // Globe Class
    // ========================================

    function Globe(container, points, options) {
        this.$container = $(container);
        this.points = points || [];
        this.radius = options.radius || 180;
        this.speed = options.speed || 0.3;
        this.autoRotate = options.autoRotate !== false;
        this.rotationY = 0;
        this.rotationX = -15;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.animationFrameId = null;
        this.pointElements = [];
        this.init();
    }

    Globe.prototype.init = function() {
        var w = this.$container.width() || 500;
        var h = this.$container.height() || 500;
        var diameter = this.radius * 2;

        // Main container
        this.$wrapper = $('<div class="sit-globe-container"></div>').css({
            width: w,
            height: h,
            background: '#111215',
            borderRadius: '8px'
        });

        // 3D scene
        this.$scene = $('<div class="sit-globe-scene"></div>').css({
            width: diameter,
            height: diameter,
            transformStyle: 'preserve-3d'
        });

        // Sphere surface
        this.$sphere = $('<div class="sit-globe-sphere"></div>').css({
            width: diameter,
            height: diameter,
            left: 0,
            top: 0
        });
        this.$scene.append(this.$sphere);

        // Draw meridians and parallels (wireframe)
        this._drawWireframe();

        // Plot data points
        this._plotPoints();

        this.$wrapper.append(this.$scene);

        // Tooltip
        this.$tooltip = $('<div class="sit-globe-tooltip"><div class="sit-globe-tt-label"></div><div class="sit-globe-tt-value"></div></div>');
        this.$wrapper.append(this.$tooltip);

        // Legend
        this._buildLegend();

        this.$container.empty().append(this.$wrapper);

        // Bind interaction
        this._bindInteraction();

        // Start animation
        if (this.autoRotate) {
            this._animate();
        } else {
            this._updateTransform();
        }
    };

    Globe.prototype._drawWireframe = function() {
        var r = this.radius;
        var d = r * 2;

        // Meridians (longitude lines)
        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * 360;
            var $m = $('<div class="sit-globe-meridian"></div>').css({
                width: d,
                height: d,
                left: 0,
                top: 0,
                transform: 'rotateY(' + angle + 'deg)',
                transformOrigin: 'center center'
            });
            this.$scene.append($m);
        }

        // Parallels (latitude lines)
        for (var j = -2; j <= 2; j++) {
            var latAngle = j * 30;
            var parallelR = r * Math.cos(latAngle * Math.PI / 180);
            var yOffset = r * Math.sin(latAngle * Math.PI / 180);
            var $p = $('<div class="sit-globe-meridian"></div>').css({
                width: parallelR * 2,
                height: parallelR * 2,
                left: r - parallelR,
                top: r - parallelR,
                transform: 'translateZ(0) rotateX(90deg) translateZ(' + yOffset + 'px)',
                transformOrigin: 'center center'
            });
            this.$scene.append($p);
        }
    };

    Globe.prototype._plotPoints = function() {
        var self = this;
        var r = this.radius;

        this.points.forEach(function(pt, idx) {
            var latRad = pt.lat * Math.PI / 180;
            var lonRad = pt.lon * Math.PI / 180;

            // Convert spherical to cartesian
            var x = r * Math.cos(latRad) * Math.sin(lonRad);
            var y = -r * Math.sin(latRad);
            var z = r * Math.cos(latRad) * Math.cos(lonRad);

            var color = CATEGORY_COLORS[pt.category] || CATEGORY_COLORS['default'];
            var size = Math.max(6, Math.min(16, (pt.value || 100) / 100));

            var $point = $('<div class="sit-globe-point"></div>').css({
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                left: r,
                top: r,
                transform: 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px)'
            });

            var $inner = $('<div class="sit-globe-point-inner"></div>').css({
                backgroundColor: color,
                color: color
            });
            $point.append($inner);

            // Store data on point
            $point.data('sit-point', pt);
            $point.data('sit-coords', { x: x, y: y, z: z });

            // Hover
            $point.on('mouseenter', function(e) {
                self.$tooltip.find('.sit-globe-tt-label').text(pt.label || 'Point ' + idx);
                self.$tooltip.find('.sit-globe-tt-value').text(
                    'Value: ' + (pt.value || 'N/A') + (pt.category ? '  |  ' + pt.category : '')
                );
                self.$tooltip.css({
                    left: e.offsetX + 20,
                    top: e.offsetY - 30
                }).addClass('visible');
            }).on('mousemove', function(e) {
                self.$tooltip.css({
                    left: e.offsetX + 20,
                    top: e.offsetY - 30
                });
            }).on('mouseleave', function() {
                self.$tooltip.removeClass('visible');
            });

            self.$scene.append($point);
            self.pointElements.push({
                $el: $point,
                origX: x,
                origY: y,
                origZ: z,
                data: pt
            });
        });
    };

    Globe.prototype._buildLegend = function() {
        var categories = {};
        this.points.forEach(function(pt) {
            var cat = pt.category || 'default';
            categories[cat] = CATEGORY_COLORS[cat] || CATEGORY_COLORS['default'];
        });

        var $legend = $('<div class="sit-globe-legend"></div>');
        Object.keys(categories).forEach(function(cat) {
            var $item = $('<div class="sit-globe-legend-item"></div>');
            $item.append($('<div class="sit-globe-legend-dot"></div>').css('background', categories[cat]));
            $item.append($('<span></span>').text(cat));
            $legend.append($item);
        });

        if (Object.keys(categories).length > 0) {
            this.$wrapper.append($legend);
        }
    };

    Globe.prototype._updateTransform = function() {
        this.$scene.css('transform',
            'rotateX(' + this.rotationX + 'deg) rotateY(' + this.rotationY + 'deg)'
        );

        // Update point visibility based on z-position after rotation
        var self = this;
        var cosX = Math.cos(this.rotationX * Math.PI / 180);
        var sinX = Math.sin(this.rotationX * Math.PI / 180);
        var cosY = Math.cos(this.rotationY * Math.PI / 180);
        var sinY = Math.sin(this.rotationY * Math.PI / 180);

        this.pointElements.forEach(function(p) {
            // Rotate the original coordinates to get current z
            var x1 = p.origX * cosY + p.origZ * sinY;
            var z1 = -p.origX * sinY + p.origZ * cosY;
            var y1 = p.origY * cosX - z1 * sinX;
            var z2 = p.origY * sinX + z1 * cosX;

            // Points behind the globe should be dimmed
            var opacity = z2 > 0 ? 1 : Math.max(0.08, 0.3 + z2 / self.radius * 0.5);
            var scale = z2 > 0 ? 1 : 0.6;
            p.$el.css({
                opacity: opacity,
                zIndex: Math.round(z2 + self.radius)
            });
        });
    };

    Globe.prototype._bindInteraction = function() {
        var self = this;

        this.$wrapper.on('mousedown', function(e) {
            if ($(e.target).closest('.sit-globe-point').length) return;
            self.isDragging = true;
            self.lastMouseX = e.clientX;
            self.lastMouseY = e.clientY;
            self.$wrapper.css('cursor', 'grabbing');
        });

        $(document).on('mousemove.sit-globe', function(e) {
            if (!self.isDragging) return;
            var dx = e.clientX - self.lastMouseX;
            var dy = e.clientY - self.lastMouseY;
            self.rotationY += dx * 0.5;
            self.rotationX -= dy * 0.3;
            self.rotationX = Math.max(-60, Math.min(60, self.rotationX));
            self.lastMouseX = e.clientX;
            self.lastMouseY = e.clientY;
            if (!self.autoRotate) {
                self._updateTransform();
            }
        });

        $(document).on('mouseup.sit-globe', function() {
            self.isDragging = false;
            self.$wrapper.css('cursor', 'grab');
        });

        this.$wrapper.css('cursor', 'grab');
    };

    Globe.prototype._animate = function() {
        var self = this;
        var lastTime = performance.now();

        function frame(now) {
            var delta = (now - lastTime) / 1000;
            lastTime = now;

            if (!self.isDragging) {
                self.rotationY += self.speed * delta * 30;
            }
            self._updateTransform();
            self.animationFrameId = requestAnimationFrame(frame);
        }

        self.animationFrameId = requestAnimationFrame(frame);
    };

    Globe.prototype.destroy = function() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        $(document).off('.sit-globe');
        this.$container.empty();
    };

    // ========================================
    // Initialization
    // ========================================

    function initGlobes() {
        $('[id*="globe-3d"], [data-viz="globe-3d"]').each(function() {
            var $el = $(this);
            if ($el.data('sit-globe-initialized')) return;
            $el.data('sit-globe-initialized', true);

            var points = [];
            try {
                points = JSON.parse($el.attr('data-points') || '[]');
            } catch(e) {
                console.error('[SIT Globe] Failed to parse points data:', e);
            }

            var options = {
                radius: parseInt($el.attr('data-radius'), 10) || 180,
                speed: parseFloat($el.attr('data-speed')) || 0.3,
                autoRotate: $el.attr('data-auto-rotate') !== 'false'
            };

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
                            var pts = rows.map(function(row) {
                                return {
                                    lat: parseFloat(row[fi['lat']]) || 0,
                                    lon: parseFloat(row[fi['lon']]) || 0,
                                    label: row[fi['label']] || '',
                                    value: parseFloat(row[fi['value']]) || 0,
                                    category: row[fi['category']] || 'default'
                                };
                            });
                            new Globe($el[0], pts, options);
                        });
                        return;
                    }
                } catch(e) {
                    console.warn('[SIT Globe] Could not bind to search:', searchId, e);
                }
            }

            new Globe($el[0], points, options);
        });
    }

    var observer = new MutationObserver(function() { initGlobes(); });
    observer.observe(document.body, { childList: true, subtree: true });
    initGlobes();

    console.log('[SIT] 3D Rotating Globe loaded');
});
