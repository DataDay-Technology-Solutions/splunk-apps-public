/**
 * Splunk Innovators Toolkit - Modal Component
 * A customizable modal dialog for Splunk dashboards
 * Version: 1.0.0
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    'use strict';

    var SITModal = Backbone.View.extend({
        
        className: 'sit-modal-backdrop',
        
        defaults: {
            title: 'Modal Title',
            content: '',
            size: 'md', // sm, md, lg, xl
            closable: true,
            closeOnBackdrop: true,
            closeOnEscape: true,
            buttons: [],
            onOpen: null,
            onClose: null,
            customClass: ''
        },
        
        events: {
            'click .sit-modal-close': 'close',
            'click .sit-modal-backdrop': 'handleBackdropClick',
            'click .sit-modal-btn': 'handleButtonClick'
        },
        
        initialize: function(options) {
            this.options = _.extend({}, this.defaults, options);
            this.isOpen = false;
            
            // Bind escape key handler
            if (this.options.closeOnEscape) {
                this.escapeHandler = _.bind(this.handleEscape, this);
            }
        },
        
        render: function() {
            var buttonsHtml = this.renderButtons();
            
            var html = [
                '<div class="sit-modal sit-modal-' + this.options.size + ' ' + this.options.customClass + '">',
                '  <div class="sit-modal-header">',
                '    <h3 class="sit-modal-title">' + _.escape(this.options.title) + '</h3>',
                this.options.closable ? '    <button class="sit-modal-close" aria-label="Close">&times;</button>' : '',
                '  </div>',
                '  <div class="sit-modal-body">',
                '    ' + this.options.content,
                '  </div>',
                buttonsHtml ? '  <div class="sit-modal-footer">' + buttonsHtml + '</div>' : '',
                '</div>'
            ].join('\n');
            
            this.$el.html(html);
            return this;
        },
        
        renderButtons: function() {
            if (!this.options.buttons || this.options.buttons.length === 0) {
                return '';
            }
            
            return _.map(this.options.buttons, function(btn, index) {
                var btnClass = 'sit-btn sit-modal-btn';
                
                switch (btn.type) {
                    case 'primary':
                        btnClass += ' sit-btn-primary';
                        break;
                    case 'danger':
                        btnClass += ' sit-btn-danger';
                        break;
                    case 'success':
                        btnClass += ' sit-btn-success';
                        break;
                    default:
                        btnClass += ' sit-btn-secondary';
                }
                
                return '<button class="' + btnClass + '" data-index="' + index + '">' + 
                       _.escape(btn.label) + '</button>';
            }).join('');
        },
        
        show: function() {
            if (this.isOpen) return this;
            
            this.render();
            $('body').append(this.$el);
            
            // Prevent body scroll
            $('body').css('overflow', 'hidden');
            
            // Bind escape key
            if (this.escapeHandler) {
                $(document).on('keydown', this.escapeHandler);
            }
            
            this.isOpen = true;
            
            // Focus first focusable element
            var $focusable = this.$el.find('button, input, select, textarea, [tabindex]:not([tabindex="-1"])').first();
            if ($focusable.length) {
                $focusable.focus();
            }
            
            // Callback
            if (_.isFunction(this.options.onOpen)) {
                this.options.onOpen.call(this);
            }
            
            this.trigger('open');
            return this;
        },
        
        close: function() {
            if (!this.isOpen) return this;
            
            // Restore body scroll
            $('body').css('overflow', '');
            
            // Unbind escape key
            if (this.escapeHandler) {
                $(document).off('keydown', this.escapeHandler);
            }
            
            this.$el.remove();
            this.isOpen = false;
            
            // Callback
            if (_.isFunction(this.options.onClose)) {
                this.options.onClose.call(this);
            }
            
            this.trigger('close');
            return this;
        },
        
        handleBackdropClick: function(e) {
            if (this.options.closeOnBackdrop && $(e.target).hasClass('sit-modal-backdrop')) {
                this.close();
            }
        },
        
        handleEscape: function(e) {
            if (e.keyCode === 27 && this.isOpen) {
                this.close();
            }
        },
        
        handleButtonClick: function(e) {
            var index = parseInt($(e.currentTarget).data('index'), 10);
            var btn = this.options.buttons[index];
            
            if (btn) {
                if (btn.action === 'close') {
                    this.close();
                } else if (_.isFunction(btn.callback)) {
                    btn.callback.call(this, e);
                }
            }
        },
        
        setTitle: function(title) {
            this.options.title = title;
            this.$el.find('.sit-modal-title').text(title);
            return this;
        },
        
        setContent: function(content) {
            this.options.content = content;
            this.$el.find('.sit-modal-body').html(content);
            return this;
        },
        
        setLoading: function(isLoading) {
            var $body = this.$el.find('.sit-modal-body');
            
            if (isLoading) {
                $body.html('<div style="text-align: center; padding: 40px;"><div class="sit-spinner sit-spinner-lg"></div></div>');
            }
            
            return this;
        }
    });
    
    // Static methods for quick modals
    SITModal.alert = function(message, title) {
        var modal = new SITModal({
            title: title || 'Alert',
            content: '<p>' + _.escape(message) + '</p>',
            size: 'sm',
            buttons: [{
                label: 'OK',
                type: 'primary',
                action: 'close'
            }]
        });
        return modal.show();
    };
    
    SITModal.confirm = function(message, title, onConfirm, onCancel) {
        var modal = new SITModal({
            title: title || 'Confirm',
            content: '<p>' + _.escape(message) + '</p>',
            size: 'sm',
            buttons: [
                {
                    label: 'Cancel',
                    type: 'secondary',
                    callback: function() {
                        modal.close();
                        if (_.isFunction(onCancel)) onCancel();
                    }
                },
                {
                    label: 'Confirm',
                    type: 'primary',
                    callback: function() {
                        modal.close();
                        if (_.isFunction(onConfirm)) onConfirm();
                    }
                }
            ]
        });
        return modal.show();
    };
    
    return SITModal;
});
