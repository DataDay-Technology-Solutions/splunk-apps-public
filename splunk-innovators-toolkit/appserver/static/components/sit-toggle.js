/**
 * Splunk Innovators Toolkit - Toggle Switch Component
 * iOS-style toggle switches
 * Version: 1.0.0
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    'use strict';

    var SITToggle = Backbone.View.extend({
        
        className: 'sit-toggle',
        
        defaults: {
            name: '',
            label: '',
            labelPosition: 'right', // left, right
            checked: false,
            disabled: false,
            size: 'md', // sm, md, lg
            onChange: null
        },
        
        events: {
            'change input': 'handleChange',
            'click': 'handleClick'
        },
        
        initialize: function(options) {
            this.options = _.extend({}, this.defaults, options);
        },
        
        render: function() {
            var id = 'sit-toggle-' + _.uniqueId();
            
            var sizes = {
                sm: { track: 'width: 36px; height: 20px;', thumb: 'width: 14px; height: 14px;', translate: '18px' },
                md: { track: 'width: 44px; height: 24px;', thumb: 'width: 18px; height: 18px;', translate: '22px' },
                lg: { track: 'width: 56px; height: 30px;', thumb: 'width: 24px; height: 24px;', translate: '28px' }
            };
            
            var size = sizes[this.options.size] || sizes.md;
            
            var labelHtml = this.options.label ? 
                '<label class="sit-toggle-label" for="' + id + '">' + _.escape(this.options.label) + '</label>' : '';
            
            var html = [
                this.options.labelPosition === 'left' ? labelHtml : '',
                '<input type="checkbox" class="sit-toggle-input" id="' + id + '"',
                '  name="' + _.escape(this.options.name) + '"',
                this.options.checked ? '  checked' : '',
                this.options.disabled ? '  disabled' : '',
                '>',
                '<span class="sit-toggle-track" style="' + size.track + '">',
                '  <span class="sit-toggle-thumb" style="' + size.thumb + '"></span>',
                '</span>',
                this.options.labelPosition === 'right' ? labelHtml : ''
            ].join('\n');
            
            this.$el.html(html);
            
            if (this.options.disabled) {
                this.$el.css('opacity', '0.5').css('cursor', 'not-allowed');
            }
            
            return this;
        },
        
        handleClick: function(e) {
            // Prevent double-firing when clicking the label or input directly
            if (e.target.tagName.toLowerCase() === 'label' || e.target.tagName.toLowerCase() === 'input') {
                return;
            }

            // Toggle when clicking the track or thumb
            var $input = this.$el.find('input');
            if (!$input.prop('disabled')) {
                $input.prop('checked', !$input.prop('checked')).trigger('change');
            }
        },

        handleChange: function(e) {
            var isChecked = this.$el.find('input').prop('checked');
            this.options.checked = isChecked;

            if (_.isFunction(this.options.onChange)) {
                this.options.onChange.call(this, isChecked);
            }

            this.trigger('change', isChecked);
        },
        
        isChecked: function() {
            return this.$el.find('input').prop('checked');
        },
        
        setChecked: function(checked, silent) {
            this.options.checked = checked;
            this.$el.find('input').prop('checked', checked);
            
            if (!silent) {
                this.handleChange();
            }
            
            return this;
        },
        
        toggle: function() {
            return this.setChecked(!this.isChecked());
        },
        
        setDisabled: function(disabled) {
            this.options.disabled = disabled;
            this.$el.find('input').prop('disabled', disabled);
            this.$el.css('opacity', disabled ? '0.5' : '1');
            this.$el.css('cursor', disabled ? 'not-allowed' : 'pointer');
            return this;
        }
    });
    
    return SITToggle;
});
