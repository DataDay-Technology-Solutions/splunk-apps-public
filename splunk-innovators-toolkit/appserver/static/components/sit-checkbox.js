/**
 * Splunk Innovators Toolkit - Checkbox Component
 * Custom styled checkboxes with group support
 * Version: 1.0.0
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    'use strict';

    // Single Checkbox
    var SITCheckbox = Backbone.View.extend({
        
        className: 'sit-checkbox',
        
        defaults: {
            name: '',
            value: '',
            label: '',
            checked: false,
            disabled: false,
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
            var id = 'sit-checkbox-' + _.uniqueId();
            
            var html = [
                '<input type="checkbox" class="sit-checkbox-input" id="' + id + '"',
                '  name="' + _.escape(this.options.name) + '"',
                '  value="' + _.escape(this.options.value) + '"',
                this.options.checked ? '  checked' : '',
                this.options.disabled ? '  disabled' : '',
                '>',
                '<span class="sit-checkbox-box">',
                '  <svg class="sit-checkbox-check" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">',
                '    <path d="M10.28 2.28a.75.75 0 0 1 0 1.06l-5.5 5.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06L4.25 7.19l4.97-4.97a.75.75 0 0 1 1.06 0z"/>',
                '  </svg>',
                '</span>',
                '<label class="sit-checkbox-label" for="' + id + '">' + _.escape(this.options.label) + '</label>'
            ].join('\n');
            
            this.$el.html(html);
            
            if (this.options.disabled) {
                this.$el.addClass('sit-checkbox-disabled');
            }
            
            return this;
        },
        
        handleClick: function(e) {
            // Prevent double-firing when clicking the label or input directly
            if (e.target.tagName.toLowerCase() === 'label' || e.target.tagName.toLowerCase() === 'input') {
                return;
            }

            // Toggle the checkbox when clicking anywhere else (like the box)
            var $input = this.$el.find('input');
            if (!$input.prop('disabled')) {
                $input.prop('checked', !$input.prop('checked')).trigger('change');
            }
        },
        
        handleChange: function(e) {
            var isChecked = this.$el.find('input').prop('checked');
            this.options.checked = isChecked;
            
            if (_.isFunction(this.options.onChange)) {
                this.options.onChange.call(this, isChecked, this.options.value);
            }
            
            this.trigger('change', isChecked, this.options.value);
        },
        
        isChecked: function() {
            return this.$el.find('input').prop('checked');
        },
        
        setChecked: function(checked) {
            this.options.checked = checked;
            this.$el.find('input').prop('checked', checked);
            return this;
        },
        
        setDisabled: function(disabled) {
            this.options.disabled = disabled;
            this.$el.find('input').prop('disabled', disabled);
            this.$el.toggleClass('sit-checkbox-disabled', disabled);
            return this;
        }
    });
    
    // Checkbox Group
    var SITCheckboxGroup = Backbone.View.extend({
        
        className: 'sit-checkbox-group',
        
        defaults: {
            name: '',
            options: [], // { value, label, checked, disabled }
            layout: 'vertical', // vertical, horizontal
            onChange: null
        },
        
        initialize: function(options) {
            this.options = _.extend({}, this.defaults, options);
            this.checkboxes = [];
        },
        
        render: function() {
            var self = this;
            
            this.$el.empty();
            
            if (this.options.layout === 'horizontal') {
                this.$el.css({
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px'
                });
            }
            
            _.each(this.options.options, function(opt) {
                var checkbox = new SITCheckbox({
                    name: self.options.name,
                    value: opt.value,
                    label: opt.label,
                    checked: opt.checked || false,
                    disabled: opt.disabled || false,
                    onChange: function(checked, value) {
                        self.handleChange();
                    }
                });
                
                checkbox.render();
                self.$el.append(checkbox.$el);
                self.checkboxes.push(checkbox);
                
                if (self.options.layout === 'vertical') {
                    checkbox.$el.css('margin-bottom', '8px');
                }
            });
            
            return this;
        },
        
        handleChange: function() {
            var selected = this.getSelected();
            
            if (_.isFunction(this.options.onChange)) {
                this.options.onChange.call(this, selected);
            }
            
            this.trigger('change', selected);
        },
        
        getSelected: function() {
            var selected = [];
            
            _.each(this.checkboxes, function(checkbox) {
                if (checkbox.isChecked()) {
                    selected.push(checkbox.options.value);
                }
            });
            
            return selected;
        },
        
        setSelected: function(values) {
            values = _.isArray(values) ? values : [values];
            
            _.each(this.checkboxes, function(checkbox) {
                var shouldCheck = _.contains(values, checkbox.options.value);
                checkbox.setChecked(shouldCheck);
            });
            
            return this;
        },
        
        selectAll: function() {
            _.each(this.checkboxes, function(checkbox) {
                if (!checkbox.options.disabled) {
                    checkbox.setChecked(true);
                }
            });
            this.handleChange();
            return this;
        },
        
        deselectAll: function() {
            _.each(this.checkboxes, function(checkbox) {
                checkbox.setChecked(false);
            });
            this.handleChange();
            return this;
        }
    });
    
    // Export both
    SITCheckbox.Group = SITCheckboxGroup;
    
    return SITCheckbox;
});
