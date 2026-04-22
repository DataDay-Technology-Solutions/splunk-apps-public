/**
 * Splunk Innovators Toolkit - Filter Chips / Tags
 * =================================================
 * Converts dropdown inputs into modern tag-style filter pills/chips.
 * Selected values display as removable chip badges for a cleaner look
 * than the default Splunk dropdowns.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/filter-chips-tags.js">
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    var mvc = null;
    try { mvc = require('splunkjs/mvc'); } catch(e) {}
    'use strict';

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Filter Chips / Tags */',
        '.sit-chips-container {',
        '    display: flex;',
        '    flex-wrap: wrap;',
        '    gap: 6px;',
        '    padding: 8px 0;',
        '    min-height: 36px;',
        '    align-items: center;',
        '}',
        '.sit-chip {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    gap: 6px;',
        '    padding: 4px 10px 4px 12px;',
        '    background: linear-gradient(135deg, #3c5bdc, #2a47b8);',
        '    color: #fff;',
        '    border-radius: 16px;',
        '    font-size: 12px;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '    font-weight: 500;',
        '    cursor: default;',
        '    transition: all 0.2s ease;',
        '    animation: sit-chip-in 0.25s ease forwards;',
        '    white-space: nowrap;',
        '}',
        '.sit-chip:hover {',
        '    background: linear-gradient(135deg, #4a6be8, #3555cc);',
        '    box-shadow: 0 2px 8px rgba(60,91,220,0.35);',
        '}',
        '.sit-chip-label {',
        '    max-width: 180px;',
        '    overflow: hidden;',
        '    text-overflow: ellipsis;',
        '}',
        '.sit-chip-remove {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    width: 16px;',
        '    height: 16px;',
        '    border-radius: 50%;',
        '    background: rgba(255,255,255,0.2);',
        '    color: #fff;',
        '    font-size: 11px;',
        '    line-height: 1;',
        '    cursor: pointer;',
        '    transition: background 0.2s ease;',
        '}',
        '.sit-chip-remove:hover {',
        '    background: rgba(255,255,255,0.4);',
        '}',
        '',
        '/* Chip for different filter types */',
        '.sit-chip-filter {',
        '    background: linear-gradient(135deg, #1b8c5a, #157a4e);',
        '}',
        '.sit-chip-filter:hover {',
        '    background: linear-gradient(135deg, #20a068, #1b8c5a);',
        '    box-shadow: 0 2px 8px rgba(27,140,90,0.35);',
        '}',
        '.sit-chip-time {',
        '    background: linear-gradient(135deg, #b85c1a, #9c4e16);',
        '}',
        '.sit-chip-time:hover {',
        '    background: linear-gradient(135deg, #cc6820, #b85c1a);',
        '    box-shadow: 0 2px 8px rgba(184,92,26,0.35);',
        '}',
        '',
        '/* Empty state */',
        '.sit-chips-empty {',
        '    color: #6b7080;',
        '    font-size: 12px;',
        '    font-style: italic;',
        '    padding: 4px 0;',
        '}',
        '',
        '/* Chip container label */',
        '.sit-chips-group-label {',
        '    font-size: 11px;',
        '    font-weight: 600;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.5px;',
        '    color: #8a8fa0;',
        '    margin-right: 4px;',
        '    white-space: nowrap;',
        '}',
        '',
        '/* Light mode */',
        '.sit-light-mode .sit-chips-empty {',
        '    color: #999;',
        '}',
        '.sit-light-mode .sit-chips-group-label {',
        '    color: #666;',
        '}',
        '',
        '/* Animation */',
        '@keyframes sit-chip-in {',
        '    0% { opacity: 0; transform: scale(0.8); }',
        '    100% { opacity: 1; transform: scale(1); }',
        '}',
        '@keyframes sit-chip-out {',
        '    0% { opacity: 1; transform: scale(1); }',
        '    100% { opacity: 0; transform: scale(0.8); }',
        '}',
        '',
        '/* Dropdown enhancements - keep dropdowns but make them slimmer */',
        '.sit-chips-active .fieldset .input {',
        '    margin-bottom: 4px;',
        '}',
        '.sit-chips-active .fieldset {',
        '    padding-bottom: 4px;',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-filter-chips-styles').text(styles).appendTo('head');

    // =============================================
    // Chip builder
    // =============================================

    function createChip(label, value, inputId, chipType) {
        var typeClass = chipType ? ' sit-chip-' + chipType : '';
        var $chip = $('<span class="sit-chip' + typeClass + '">' +
            '<span class="sit-chip-label" title="' + $('<span>').text(label).html() + '">' +
            $('<span>').text(label).html() +
            '</span>' +
            '<span class="sit-chip-remove" data-input-id="' + inputId + '" data-value="' + $('<span>').text(value).html() + '">&times;</span>' +
            '</span>');
        return $chip;
    }

    function getChipType(inputLabel) {
        var lower = (inputLabel || '').toLowerCase();
        if (lower.indexOf('time') >= 0 || lower.indexOf('date') >= 0 || lower.indexOf('range') >= 0) {
            return 'time';
        }
        if (lower.indexOf('filter') >= 0 || lower.indexOf('source') >= 0 || lower.indexOf('index') >= 0 || lower.indexOf('host') >= 0) {
            return 'filter';
        }
        return '';
    }

    // =============================================
    // Setup filter chips
    // =============================================

    var $fieldset = $('.fieldset');
    if (!$fieldset.length) {
        console.log('[SIT] Filter Chips: No fieldset found, skipping.');
        return;
    }

    $('body').addClass('sit-chips-active');

    // Create chip display area below the fieldset
    var $chipsArea = $('<div class="sit-chips-container"></div>');
    $fieldset.after($chipsArea);

    function refreshChips() {
        $chipsArea.empty();

        var hasChips = false;
        var defaultTokenModel = mvc.Components.get('default');

        $fieldset.find('.input').each(function() {
            var $inputWrapper = $(this);
            var $label = $inputWrapper.find('label');
            var labelText = $label.text().trim();
            var chipType = getChipType(labelText);

            // Try to find the Splunk MVC component
            var inputId = $inputWrapper.attr('id');
            if (!inputId) return;

            // Get the display value from the visible element
            var displayValues = [];

            // Check for select2 (dropdown) values
            var $select2 = $inputWrapper.find('.select2-chosen');
            if ($select2.length) {
                var val = $select2.text().trim();
                if (val && val !== '' && val.toLowerCase() !== 'all' && val !== '--') {
                    displayValues.push({ label: val, value: val });
                }
            }

            // Check for multiselect choices
            var $multiChoices = $inputWrapper.find('.select2-search-choice');
            if ($multiChoices.length) {
                $multiChoices.each(function() {
                    var val = $(this).text().trim().replace(/\u00d7$/, '').trim();
                    if (val) {
                        displayValues.push({ label: val, value: val });
                    }
                });
            }

            // Check for radio/checkbox inputs
            var $checkedInputs = $inputWrapper.find('input:checked');
            if ($checkedInputs.length && !$select2.length) {
                $checkedInputs.each(function() {
                    var $this = $(this);
                    var val = $this.val();
                    var lbl = $this.closest('label').text().trim() || val;
                    if (val && val !== '*' && val.toLowerCase() !== 'all') {
                        displayValues.push({ label: lbl, value: val });
                    }
                });
            }

            // Check for text inputs
            var $textInput = $inputWrapper.find('input[type="text"]');
            if ($textInput.length && !$select2.length) {
                var textVal = $textInput.val();
                if (textVal && textVal.trim()) {
                    displayValues.push({ label: textVal.trim(), value: textVal.trim() });
                }
            }

            // Create chips
            displayValues.forEach(function(dv) {
                var chipLabel = labelText ? labelText + ': ' + dv.label : dv.label;
                var $chip = createChip(chipLabel, dv.value, inputId, chipType);
                $chipsArea.append($chip);
                hasChips = true;
            });
        });

        if (!hasChips) {
            $chipsArea.html('<span class="sit-chips-empty">No active filters</span>');
        }
    }

    // Remove chip handler
    $chipsArea.on('click', '.sit-chip-remove', function() {
        var $this = $(this);
        var inputId = $this.data('input-id');
        var $chip = $this.closest('.sit-chip');

        // Animate removal
        $chip.css('animation', 'sit-chip-out 0.2s ease forwards');
        setTimeout(function() {
            $chip.remove();

            // Try to reset the input
            var $input = $('#' + inputId);
            if ($input.length) {
                // For dropdowns, try to reset to first/default option
                var $select = $input.find('select');
                if ($select.length) {
                    $select.val($select.find('option:first').val()).trigger('change');
                }
                // For text inputs
                var $text = $input.find('input[type="text"]');
                if ($text.length) {
                    $text.val('').trigger('change');
                }
            }

            // Refresh chips after a brief delay
            setTimeout(refreshChips, 200);
        }, 200);
    });

    // Monitor for changes in fieldset inputs
    $fieldset.on('change', 'input, select', function() {
        setTimeout(refreshChips, 100);
    });

    // Also listen for Splunk token changes
    var defaultTokens = mvc.Components.get('default');
    if (defaultTokens) {
        defaultTokens.on('change', function() {
            setTimeout(refreshChips, 200);
        });
    }

    // MutationObserver for select2 changes
    var observer = new MutationObserver(function(mutations) {
        var shouldRefresh = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                shouldRefresh = true;
            }
        });
        if (shouldRefresh) {
            setTimeout(refreshChips, 150);
        }
    });

    $fieldset.find('.select2-chosen, .select2-search-choice').each(function() {
        observer.observe(this.parentNode || this, { childList: true, characterData: true, subtree: true });
    });

    // Initial render
    setTimeout(refreshChips, 500);

    console.log('[SIT] Filter Chips/Tags loaded.');
});
