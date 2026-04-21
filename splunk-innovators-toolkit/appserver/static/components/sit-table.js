/**
 * Splunk Innovators Toolkit - Data Table Component
 * Sortable, filterable, paginated tables
 * Version: 1.0.0
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    'use strict';

    var SITTable = Backbone.View.extend({
        
        className: 'sit-table-wrapper',
        
        defaults: {
            columns: [], // { field, label, sortable, type, width, render }
            data: [],
            sortField: null,
            sortDirection: 'asc',
            pagination: false,
            pageSize: 10,
            currentPage: 1,
            striped: true,
            hoverable: true,
            clickable: false,
            emptyMessage: 'No data available',
            onRowClick: null,
            onSort: null
        },
        
        events: {
            'click th[data-sortable="true"]': 'handleSort',
            'click tbody tr': 'handleRowClick',
            'click .sit-table-page': 'handlePageClick',
            'click .sit-table-prev': 'handlePrevPage',
            'click .sit-table-next': 'handleNextPage'
        },
        
        initialize: function(options) {
            this.options = _.extend({}, this.defaults, options);
            this.filteredData = this.options.data;
        },
        
        render: function() {
            var html = [
                '<table class="sit-table' + 
                    (this.options.striped ? ' sit-table-striped' : '') +
                    (this.options.clickable ? ' sit-table-clickable' : '') +
                '">',
                this.renderHeader(),
                this.renderBody(),
                '</table>',
                this.options.pagination ? this.renderPagination() : ''
            ].join('\n');
            
            this.$el.html(html);
            return this;
        },
        
        renderHeader: function() {
            var self = this;
            
            var ths = _.map(this.options.columns, function(col) {
                var sortable = col.sortable !== false;
                var isSorted = self.options.sortField === col.field;
                var sortIcon = '';
                
                if (sortable && isSorted) {
                    sortIcon = self.options.sortDirection === 'asc' ? ' ↑' : ' ↓';
                }
                
                var style = col.width ? ' style="width: ' + col.width + '"' : '';
                
                return '<th data-field="' + col.field + '" data-sortable="' + sortable + '"' + style + '>' +
                       _.escape(col.label) + sortIcon + '</th>';
            });
            
            return '<thead><tr>' + ths.join('') + '</tr></thead>';
        },
        
        renderBody: function() {
            var self = this;
            var data = this.getPageData();
            
            if (data.length === 0) {
                var colspan = this.options.columns.length;
                return '<tbody><tr><td colspan="' + colspan + '" style="text-align: center; padding: 40px; color: var(--sit-text-muted);">' +
                       this.options.emptyMessage + '</td></tr></tbody>';
            }
            
            var rows = _.map(data, function(row, rowIndex) {
                var tds = _.map(self.options.columns, function(col) {
                    var value = row[col.field];
                    var displayValue;
                    
                    if (_.isFunction(col.render)) {
                        displayValue = col.render(value, row, rowIndex);
                    } else {
                        displayValue = _.escape(value !== undefined ? value : '');
                    }
                    
                    return '<td>' + displayValue + '</td>';
                });
                
                return '<tr data-index="' + rowIndex + '">' + tds.join('') + '</tr>';
            });
            
            return '<tbody>' + rows.join('') + '</tbody>';
        },
        
        renderPagination: function() {
            var totalPages = this.getTotalPages();
            var currentPage = this.options.currentPage;
            
            if (totalPages <= 1) return '';
            
            var pages = [];
            
            // Previous button
            pages.push('<button class="sit-btn sit-btn-sm sit-btn-secondary sit-table-prev"' +
                       (currentPage === 1 ? ' disabled' : '') + '>&laquo; Prev</button>');
            
            // Page numbers
            var startPage = Math.max(1, currentPage - 2);
            var endPage = Math.min(totalPages, currentPage + 2);
            
            if (startPage > 1) {
                pages.push('<button class="sit-btn sit-btn-sm sit-btn-ghost sit-table-page" data-page="1">1</button>');
                if (startPage > 2) {
                    pages.push('<span style="padding: 0 8px;">...</span>');
                }
            }
            
            for (var i = startPage; i <= endPage; i++) {
                var isActive = i === currentPage;
                pages.push('<button class="sit-btn sit-btn-sm ' + 
                          (isActive ? 'sit-btn-primary' : 'sit-btn-ghost') + 
                          ' sit-table-page" data-page="' + i + '">' + i + '</button>');
            }
            
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pages.push('<span style="padding: 0 8px;">...</span>');
                }
                pages.push('<button class="sit-btn sit-btn-sm sit-btn-ghost sit-table-page" data-page="' + 
                          totalPages + '">' + totalPages + '</button>');
            }
            
            // Next button
            pages.push('<button class="sit-btn sit-btn-sm sit-btn-secondary sit-table-next"' +
                       (currentPage === totalPages ? ' disabled' : '') + '>Next &raquo;</button>');
            
            return '<div class="sit-table-pagination" style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 16px;">' +
                   pages.join('') + '</div>';
        },
        
        handleSort: function(e) {
            var field = $(e.currentTarget).data('field');
            
            if (this.options.sortField === field) {
                this.options.sortDirection = this.options.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.options.sortField = field;
                this.options.sortDirection = 'asc';
            }
            
            this.sortData();
            this.options.currentPage = 1;
            this.render();
            
            if (_.isFunction(this.options.onSort)) {
                this.options.onSort.call(this, field, this.options.sortDirection);
            }
            
            this.trigger('sort', field, this.options.sortDirection);
        },
        
        handleRowClick: function(e) {
            if (!this.options.clickable) return;
            
            var index = parseInt($(e.currentTarget).data('index'), 10);
            var pageData = this.getPageData();
            var row = pageData[index];
            
            if (row && _.isFunction(this.options.onRowClick)) {
                this.options.onRowClick.call(this, row, index, e);
            }
            
            this.trigger('rowclick', row, index);
        },
        
        handlePageClick: function(e) {
            var page = parseInt($(e.currentTarget).data('page'), 10);
            this.goToPage(page);
        },
        
        handlePrevPage: function() {
            if (this.options.currentPage > 1) {
                this.goToPage(this.options.currentPage - 1);
            }
        },
        
        handleNextPage: function() {
            if (this.options.currentPage < this.getTotalPages()) {
                this.goToPage(this.options.currentPage + 1);
            }
        },
        
        sortData: function() {
            var self = this;
            var field = this.options.sortField;
            var direction = this.options.sortDirection;
            
            if (!field) return;
            
            var col = _.find(this.options.columns, function(c) {
                return c.field === field;
            });
            
            this.filteredData = _.sortBy(this.filteredData, function(row) {
                var value = row[field];
                
                if (col && col.type === 'number') {
                    return parseFloat(value) || 0;
                }
                
                return String(value).toLowerCase();
            });
            
            if (direction === 'desc') {
                this.filteredData = this.filteredData.reverse();
            }
        },
        
        getPageData: function() {
            if (!this.options.pagination) {
                return this.filteredData;
            }
            
            var start = (this.options.currentPage - 1) * this.options.pageSize;
            var end = start + this.options.pageSize;
            
            return this.filteredData.slice(start, end);
        },
        
        getTotalPages: function() {
            return Math.ceil(this.filteredData.length / this.options.pageSize);
        },
        
        goToPage: function(page) {
            var totalPages = this.getTotalPages();
            page = Math.max(1, Math.min(page, totalPages));
            
            this.options.currentPage = page;
            this.render();
            
            this.trigger('pagechange', page);
            return this;
        },
        
        setData: function(data) {
            this.options.data = data;
            this.filteredData = data;
            this.options.currentPage = 1;
            
            if (this.options.sortField) {
                this.sortData();
            }
            
            this.render();
            return this;
        },
        
        filter: function(predicate) {
            if (_.isFunction(predicate)) {
                this.filteredData = _.filter(this.options.data, predicate);
            } else {
                this.filteredData = this.options.data;
            }
            
            this.options.currentPage = 1;
            
            if (this.options.sortField) {
                this.sortData();
            }
            
            this.render();
            return this;
        },
        
        search: function(query, fields) {
            var self = this;
            query = String(query).toLowerCase().trim();
            
            if (!query) {
                this.filteredData = this.options.data;
            } else {
                fields = fields || _.pluck(this.options.columns, 'field');
                
                this.filteredData = _.filter(this.options.data, function(row) {
                    return _.some(fields, function(field) {
                        var value = String(row[field] || '').toLowerCase();
                        return value.indexOf(query) !== -1;
                    });
                });
            }
            
            this.options.currentPage = 1;
            
            if (this.options.sortField) {
                this.sortData();
            }
            
            this.render();
            return this;
        },
        
        getSelectedRows: function() {
            // For future checkbox selection feature
            return [];
        },
        
        refresh: function() {
            this.render();
            return this;
        }
    });
    
    return SITTable;
});
