/**
 * Splunk Innovators Toolkit - Toast Notifications
 * Beautiful toast notifications for Splunk dashboards
 * Version: 1.0.0
 */

define([
    'jquery',
    'underscore'
], function($, _) {
    'use strict';

    var containerClass = 'sit-toast-container';
    var $container = null;
    
    var defaults = {
        duration: 4000,
        position: 'top-right', // top-right, top-left, bottom-right, bottom-left
        closable: true
    };
    
    var icons = {
        success: '<svg class="sit-toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
        error: '<svg class="sit-toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
        warning: '<svg class="sit-toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
        info: '<svg class="sit-toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
    };
    
    function getContainer(position) {
        if (!$container || !$container.length || !$.contains(document.body, $container[0])) {
            $container = $('<div class="' + containerClass + '"></div>');
            $('body').append($container);
        }
        
        // Update position
        var positions = {
            'top-right': { top: '24px', right: '24px', bottom: 'auto', left: 'auto' },
            'top-left': { top: '24px', left: '24px', bottom: 'auto', right: 'auto' },
            'bottom-right': { bottom: '24px', right: '24px', top: 'auto', left: 'auto' },
            'bottom-left': { bottom: '24px', left: '24px', top: 'auto', right: 'auto' }
        };
        
        $container.css(positions[position] || positions['top-right']);
        
        return $container;
    }
    
    function createToast(type, message, options) {
        options = _.extend({}, defaults, options);
        
        var $container = getContainer(options.position);
        
        var toastHtml = [
            '<div class="sit-toast sit-toast-' + type + '">',
            '  ' + icons[type],
            '  <div class="sit-toast-content">',
            options.title ? '    <div class="sit-toast-title">' + _.escape(options.title) + '</div>' : '',
            '    <div class="sit-toast-message">' + _.escape(message) + '</div>',
            '  </div>',
            options.closable ? '  <button class="sit-toast-close">&times;</button>' : '',
            '</div>'
        ].join('\n');
        
        var $toast = $(toastHtml);
        
        // Add to container
        $container.append($toast);
        
        // Close button handler
        $toast.find('.sit-toast-close').on('click', function() {
            dismissToast($toast);
        });
        
        // Auto dismiss
        if (options.duration > 0) {
            setTimeout(function() {
                dismissToast($toast);
            }, options.duration);
        }
        
        // Return toast element for manual control
        return $toast;
    }
    
    function dismissToast($toast) {
        $toast.addClass('sit-toast-exit');
        setTimeout(function() {
            $toast.remove();
        }, 200);
    }
    
    // Public API
    var SITToast = {
        success: function(message, options) {
            return createToast('success', message, _.extend({ title: 'Success' }, options));
        },
        
        error: function(message, options) {
            return createToast('error', message, _.extend({ title: 'Error', duration: 6000 }, options));
        },
        
        warning: function(message, options) {
            return createToast('warning', message, _.extend({ title: 'Warning' }, options));
        },
        
        info: function(message, options) {
            return createToast('info', message, options);
        },
        
        // Generic method
        show: function(type, message, options) {
            return createToast(type, message, options);
        },
        
        // Dismiss all toasts
        dismissAll: function() {
            if ($container) {
                $container.find('.sit-toast').each(function() {
                    dismissToast($(this));
                });
            }
        },
        
        // Configure defaults
        setDefaults: function(newDefaults) {
            _.extend(defaults, newDefaults);
        }
    };
    
    return SITToast;
});
