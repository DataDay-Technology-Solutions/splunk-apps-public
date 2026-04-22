/**
 * Splunk Innovators Toolkit - Main Script
 * Initializes all demo components across all toolkit dashboards
 * Version: 1.0.0
 */

require([
    'jquery',
    'underscore',
    'app/splunk-innovators-toolkit/components/sit-modal',
    'app/splunk-innovators-toolkit/components/sit-toast',
    'app/splunk-innovators-toolkit/components/sit-button',
    'app/splunk-innovators-toolkit/components/sit-checkbox',
    'app/splunk-innovators-toolkit/components/sit-toggle',
    'app/splunk-innovators-toolkit/components/sit-table',
    'app/splunk-innovators-toolkit/js/sit-funny-messages'
], function($, _, SITModal, SITToast, SITButton, SITCheckbox, SITToggle, SITTable, FunnyMessages) {
    'use strict';

    console.log('Innovators Toolkit loaded!');

    // Make components globally available for reference
    window.SIT = {
        Modal: SITModal,
        Toast: SITToast,
        Button: SITButton,
        Checkbox: SITCheckbox,
        Toggle: SITToggle,
        Table: SITTable,
        FunnyMessages: FunnyMessages
    };

    // ========================================
    // Modal Demo
    // ========================================
    
    $('#demo-modal').on('click', function() {
        var funnyContent = FunnyMessages.getRandomContent();
        var modal = new SITModal({
            title: FunnyMessages.getRandomTitle(),
            content: '<p style="font-size: 15px; line-height: 1.6;">' + funnyContent + '</p>',
            size: 'md',
            buttons: [
                {
                    label: 'Meh, Whatever',
                    type: 'secondary',
                    action: 'close'
                },
                {
                    label: 'That Was Hilarious!',
                    type: 'primary',
                    callback: function() {
                        SITToast.success(FunnyMessages.getRandomSuccess());
                        modal.close();
                    }
                }
            ]
        });
        modal.show();
    });

    // ========================================
    // Confirm Dialog Demo
    // ========================================
    
    $('#demo-confirm').on('click', function() {
        SITModal.confirm(
            FunnyMessages.getRandomConfirm(),
            'The Big Decision',
            function() {
                SITToast.success(FunnyMessages.getRandomSuccess());
            },
            function() {
                SITToast.info('You chickened out! Just kidding, smart choice maybe?');
            }
        );
    });

    // ========================================
    // Toast Demos
    // ========================================
    
    $('#demo-toast-success').on('click', function() {
        SITToast.success('Operation completed successfully!');
    });
    
    $('#demo-toast-error').on('click', function() {
        SITToast.error('Something went wrong. Please try again.');
    });
    
    $('#demo-toast-warning').on('click', function() {
        SITToast.warning('Your session will expire in 5 minutes.');
    });

    // ========================================
    // Checkbox Demo
    // ========================================
    
    var checkboxGroup = new SITCheckbox.Group({
        name: 'servers',
        options: [
            { value: 'web', label: 'Web Servers', checked: true },
            { value: 'db', label: 'Database Servers', checked: false },
            { value: 'app', label: 'Application Servers', checked: true },
            { value: 'cache', label: 'Cache Servers', checked: false }
        ],
        layout: 'vertical',
        onChange: function(selected) {
            console.log('Selected servers:', selected);
        }
    });
    
    checkboxGroup.render();
    $('#checkbox-container').append(checkboxGroup.$el);

    // ========================================
    // Toggle Demo
    // ========================================
    
    var toggleContainer = $('#toggle-container');
    
    var toggle1 = new SITToggle({
        name: 'realtime',
        label: 'Enable Real-time Mode',
        checked: true,
        onChange: function(checked) {
            SITToast.info('Real-time mode: ' + (checked ? 'ON' : 'OFF'));
        }
    });
    toggle1.render();
    toggleContainer.append(toggle1.$el);
    
    toggleContainer.append('<div style="height: 12px;"></div>');
    
    var toggle2 = new SITToggle({
        name: 'notifications',
        label: 'Email Notifications',
        checked: false,
        onChange: function(checked) {
            SITToast.info('Email notifications: ' + (checked ? 'ON' : 'OFF'));
        }
    });
    toggle2.render();
    toggleContainer.append(toggle2.$el);

    // ========================================
    // Table Demo
    // ========================================
    
    var sampleData = [
        { host: 'web-server-01', status: 'Running', cpu: 45, memory: 62, events: 15234 },
        { host: 'web-server-02', status: 'Running', cpu: 38, memory: 55, events: 12876 },
        { host: 'db-server-01', status: 'Warning', cpu: 78, memory: 89, events: 8923 },
        { host: 'db-server-02', status: 'Running', cpu: 52, memory: 71, events: 9102 },
        { host: 'app-server-01', status: 'Running', cpu: 33, memory: 48, events: 21456 },
        { host: 'app-server-02', status: 'Critical', cpu: 95, memory: 94, events: 45678 },
        { host: 'cache-server-01', status: 'Running', cpu: 22, memory: 35, events: 5643 },
        { host: 'cache-server-02', status: 'Running', cpu: 18, memory: 29, events: 4521 },
        { host: 'proxy-server-01', status: 'Running', cpu: 41, memory: 52, events: 18234 },
        { host: 'proxy-server-02', status: 'Warning', cpu: 67, memory: 73, events: 16789 },
        { host: 'monitor-server-01', status: 'Running', cpu: 28, memory: 44, events: 32145 },
        { host: 'backup-server-01', status: 'Running', cpu: 15, memory: 22, events: 2341 }
    ];
    
    var table = new SITTable({
        columns: [
            { field: 'host', label: 'Hostname', sortable: true },
            { 
                field: 'status', 
                label: 'Status', 
                sortable: true,
                render: function(value) {
                    var badgeClass = {
                        'Running': 'sit-badge-success',
                        'Warning': 'sit-badge-warning',
                        'Critical': 'sit-badge-error'
                    }[value] || 'sit-badge-info';
                    
                    return '<span class="sit-badge ' + badgeClass + '">' + value + '</span>';
                }
            },
            { field: 'cpu', label: 'CPU %', sortable: true, type: 'number' },
            { field: 'memory', label: 'Memory %', sortable: true, type: 'number' },
            { field: 'events', label: 'Events', sortable: true, type: 'number' }
        ],
        data: sampleData,
        pagination: true,
        pageSize: 5,
        striped: true,
        clickable: true,
        onRowClick: function(row) {
            SITModal.alert('You clicked on ' + row.host + '! ' + FunnyMessages.getRandomAlert(), FunnyMessages.getRandomAlertTitle());
        }
    });
    
    table.render();
    $('#demo-table').append(table.$el);
    
    // Table search
    $('#table-search').on('input', function() {
        var query = $(this).val();
        table.search(query, ['host', 'status']);
    });

    // ========================================
    // Tabs Demo (works on all pages)
    // ========================================

    $('.sit-tab').on('click', function() {
        var tabId = $(this).data('tab');
        var $tabsContainer = $(this).closest('.sit-tabs');

        // Update tab buttons within this tab group
        $tabsContainer.find('.sit-tab').removeClass('sit-tab-active');
        $(this).addClass('sit-tab-active');

        // Update tab panels within this tab group
        $tabsContainer.find('.sit-tab-panel').removeClass('sit-tab-panel-active');
        $('#' + tabId).addClass('sit-tab-panel-active');
    });

    // ========================================
    // Component Reference Page Demos
    // ========================================

    // Reference Modal Demos
    $('#ref-modal-basic').on('click', function() {
        var modal = new SITModal({
            title: FunnyMessages.getRandomTitle(),
            content: '<p style="font-size: 15px; line-height: 1.6;">' + FunnyMessages.getRandomContent() + '</p>',
            size: 'md',
            buttons: [
                { label: 'Nope', type: 'secondary', action: 'close' },
                { label: 'Yep!', type: 'primary', action: 'close' }
            ]
        });
        modal.show();
    });

    $('#ref-modal-alert').on('click', function() {
        SITModal.alert(FunnyMessages.getRandomAlert(), FunnyMessages.getRandomAlertTitle());
    });

    $('#ref-modal-confirm').on('click', function() {
        SITModal.confirm(
            FunnyMessages.getRandomConfirm(),
            'Decision Time!',
            function() { SITToast.success(FunnyMessages.getRandomSuccess()); },
            function() { SITToast.info('Maybe next time! No pressure.'); }
        );
    });

    // Reference Toast Demos
    $('#ref-toast-success').on('click', function() {
        SITToast.success('This is a success notification!');
    });

    $('#ref-toast-error').on('click', function() {
        SITToast.error('This is an error notification!');
    });

    $('#ref-toast-warning').on('click', function() {
        SITToast.warning('This is a warning notification!');
    });

    $('#ref-toast-info').on('click', function() {
        SITToast.info('This is an info notification.');
    });

    // Reference Checkbox Demo
    if ($('#ref-checkbox-demo').length) {
        var refCheckboxGroup = new SITCheckbox.Group({
            name: 'ref-options',
            options: [
                { value: 'opt1', label: 'Option 1', checked: true },
                { value: 'opt2', label: 'Option 2', checked: false },
                { value: 'opt3', label: 'Option 3 (disabled)', checked: false, disabled: true }
            ],
            layout: 'vertical',
            onChange: function(selected) {
                SITToast.info('Selected: ' + selected.join(', '));
            }
        });
        refCheckboxGroup.render();
        $('#ref-checkbox-demo').append(refCheckboxGroup.$el);
    }

    // Reference Toggle Demo
    if ($('#ref-toggle-demo').length) {
        var refToggle = new SITToggle({
            name: 'ref-feature',
            label: 'Enable Feature',
            checked: false,
            onChange: function(checked) {
                SITToast.info('Feature is now ' + (checked ? 'enabled' : 'disabled'));
            }
        });
        refToggle.render();
        $('#ref-toggle-demo').append(refToggle.$el);
    }

    // Reference Table Demo
    if ($('#ref-table-demo').length) {
        var refTableData = [
            { name: 'Server Alpha', status: 'online', uptime: 99.9 },
            { name: 'Server Beta', status: 'online', uptime: 98.5 },
            { name: 'Server Gamma', status: 'offline', uptime: 0 },
            { name: 'Server Delta', status: 'warning', uptime: 85.2 }
        ];

        var refTable = new SITTable({
            columns: [
                { field: 'name', label: 'Server Name', sortable: true },
                {
                    field: 'status',
                    label: 'Status',
                    sortable: true,
                    render: function(value) {
                        var badgeClass = {
                            'online': 'sit-badge-success',
                            'offline': 'sit-badge-error',
                            'warning': 'sit-badge-warning'
                        }[value] || 'sit-badge-info';
                        return '<span class="sit-badge ' + badgeClass + '">' + value.toUpperCase() + '</span>';
                    }
                },
                { field: 'uptime', label: 'Uptime %', sortable: true, type: 'number' }
            ],
            data: refTableData,
            pagination: false,
            striped: true,
            clickable: true,
            onRowClick: function(row) {
                SITToast.info('Clicked: ' + row.name);
            }
        });
        refTable.render();
        $('#ref-table-demo').append(refTable.$el);
    }

    console.log('All toolkit components initialized!');
});
