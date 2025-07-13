// ui.js

// Loader
function showLoader() {
    $('#loader').show();
}
function hideLoader() {
    $('#loader').hide();
}

// Table management for nested drill-down
let tableSections = [];

function createTableSection(tableId, heading, data, options = {}) {
    const section = {
        id: tableId,
        heading: heading,
        data: data,
        options: options,
        currentPage: 1,
        searchValue: '',
        filteredData: data
    };
    
    const sectionHtml = `
        <div class="table-section" id="section-${tableId}">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0">${heading}</h4>
            </div>
            <div class="row mb-3 justify-content-end">
                <div class="col-auto">
                    <input type="text" class="table-search form-control" data-table-id="${tableId}" placeholder="Search table...">
                </div>
            </div>
            <div class="search-count row mb-2 justify-content-end" data-table-id="${tableId}">
                <div class="col-auto">
                    <small class="text-muted"></small>
                </div>
            </div>
            <div class="table-container" data-table-id="${tableId}"></div>
            <div class="pagination-controls d-flex justify-content-between align-items-center my-2" data-table-id="${tableId}">
                <button class="prev-page btn btn-outline-primary btn-sm" data-table-id="${tableId}">Previous</button>
                <span class="page-info mx-2" data-table-id="${tableId}"></span>
                <button class="next-page btn btn-outline-primary btn-sm" data-table-id="${tableId}">Next</button>
            </div>
        </div>
    `;
    
    $('#tables-container').append(sectionHtml);
    tableSections.push(section);
    
    renderTableForSection(tableId, data, options);
    updatePaginationForSection(tableId, data.length, 1, PAGE_SIZE);
}

function updateTableSection(tableId, data, options = {}) {
    const section = tableSections.find(s => s.id === tableId);
    if (section) {
        section.data = data;
        section.filteredData = data;
        section.currentPage = 1;
        section.searchValue = '';
        section.options = options;
        
        // Clear search box
        $(`.table-search[data-table-id="${tableId}"]`).val('');
        $(`.search-count[data-table-id="${tableId}"] small`).text('');
        
        renderTableForSection(tableId, data, options);
        updatePaginationForSection(tableId, data.length, 1, PAGE_SIZE);
    }
}

function removeTableSection(tableId) {
    const sectionIndex = tableSections.findIndex(s => s.id === tableId);
    if (sectionIndex !== -1) {
        tableSections.splice(sectionIndex, 1);
        $(`#section-${tableId}`).remove();
    }
}

function removeChildTables(parentTableId) {
    // Remove all tables that come after the parent
    const parentIndex = tableSections.findIndex(s => s.id === parentTableId);
    if (parentIndex !== -1) {
        // Remove all sections after the parent
        for (let i = tableSections.length - 1; i > parentIndex; i--) {
            const section = tableSections[i];
            $(`#section-${section.id}`).remove();
            tableSections.splice(i, 1);
        }
    }
}

// Table rendering for individual sections
function renderTableForSection(tableId, data, options = {}) {
    const container = $(`.table-container[data-table-id="${tableId}"]`);
    
    if (!Array.isArray(data) || data.length === 0) {
        container.html('<p>No data available.</p>');
        $(`.pagination-controls[data-table-id="${tableId}"]`).hide();
        $(`.page-info[data-table-id="${tableId}"]`).text('');
        return;
    }
    
    $(`.pagination-controls[data-table-id="${tableId}"]`).show();
    
    if (options.errorDetails) {
        renderErrorDetailsTableForSection(tableId, data);
    } else {
        renderRegularTableForSection(tableId, data, options);
    }
}

function renderRegularTableForSection(tableId, data, options = {}) {
    const container = $(`.table-container[data-table-id="${tableId}"]`);
    const section = tableSections.find(s => s.id === tableId);
    const pageSize = PAGE_SIZE;
    const currentPage = section ? section.currentPage : 1;
    const paginatedData = getPaginatedData(data, currentPage, pageSize);
    
    const columns = options.columns || Object.keys(paginatedData[0] || {});
    let table = '<div class="table-responsive"><table class="table table-striped table-hover table-bordered align-middle">';
    table += '<thead class="table-info"><tr>';
    columns.forEach(col => {
        table += `<th scope="col">${col}</th>`;
    });
    table += '</tr></thead><tbody>';
    
    paginatedData.forEach(row => {
        table += '<tr>';
        columns.forEach(col => {
            if (options.hashLink && col === 'hash' && row[col]) {
                table += `<td><a href="#" class="hash-link" data-hash="${row[col]}">${row[col]}</a></td>`;
            } else if (options.errorIdLink && col === 'errorId' && row[col]) {
                table += `<td><a href="#" class="error-link" data-streamid="${row['streamId']}" data-errorid="${row[col]}">${row[col]}</a></td>`;
            } else if (col === 'streamId' && row[col] && options.streamIdLink) {
                table += `<td><a href="#" class="stream-link" data-streamid="${row[col]}">${row[col]}</a></td>`;
            } else {
                table += `<td class="align-top">${row[col] !== null ? row[col] : ''}</td>`;
            }
        });
        table += '</tr>';
    });
    table += '</tbody></table></div>';
    
    container.html(table);
}

function renderErrorDetailsTableForSection(tableId, data) {
    const container = $(`.table-container[data-table-id="${tableId}"]`);
    
    // Always hide pagination controls and search for error details
    $(`.pagination-controls[data-table-id="${tableId}"]`).hide();
    $(`.page-info[data-table-id="${tableId}"]`).text('');
    $(`.table-search[data-table-id="${tableId}"]`).closest('.row').hide();
    
    if (!Array.isArray(data) || data.length === 0) {
        container.html('<p>No data available.</p>');
        return;
    }
    
    const fields = [
        'streamErrorDetails.hash',
        'streamErrorDetails.exceptionMessage',
        'streamErrorDetails.causeMessage',
        'streamErrorDetails.eventName',
        'streamErrorDetails.eventId',
        'streamErrorDetails.positionInStream',
        'streamErrorDetails.dateCreated',
        'streamErrorDetails.fullStackTrace',
        'streamErrorHash.exceptionClassName',
        'streamErrorHash.causeClassName',
        'streamErrorHash.javaClassName',
        'streamErrorHash.javaMethod',
        'streamErrorHash.javaLineNumber'
    ];
    
    let table = '<div class="table-responsive"><table class="table table-striped table-hover table-bordered align-top">';
    table += '<thead class="table-info"><tr>';
    fields.forEach(f => {
        table += `<th scope="col">${f}</th>`;
    });
    table += '</tr></thead><tbody>';
    
    data.forEach((row, rowIdx) => {
        table += '<tr>';
        fields.forEach((f, colIdx) => {
            const [parent, child] = f.split('.');
            let value = row;
            if (child) {
                value = (row[parent] && row[parent][child] !== undefined) ? row[parent][child] : '';
            } else {
                value = row[parent] !== undefined ? row[parent] : '';
            }
            if (f === 'streamErrorDetails.fullStackTrace' && value) {
                const lines = value.split('\n');
                const shortText = lines.slice(0, 3).join('<br>');
                const isLong = lines.length > 3;
                const cellId = `stacktrace-cell-${tableId}-${rowIdx}`;
                table += `<td class="align-top" style="word-break:break-all;">`;
                table += `<div id="${cellId}-short">${shortText}${isLong ? '<br><a href="#" class="expand-stacktrace" data-cellid="' + cellId + '">see full details</a>' : ''}</div>`;
                if (isLong) {
                    table += `<div id="${cellId}-full" style="display:none;">${lines.join('<br>')}<br><a href="#" class="collapse-stacktrace" data-cellid="${cellId}">show less</a></div>`;
                }
                table += `</td>`;
            } else {
                table += `<td class="align-top" style="word-break:break-all;">${value !== null ? value : ''}</td>`;
            }
        });
        table += '</tr>';
    });
    table += '</tbody></table></div>';
    
    container.html(table);
    
    // Add expand/collapse handlers
    $(`.table-container[data-table-id="${tableId}"] .expand-stacktrace`).off('click').on('click', function(e) {
        e.preventDefault();
        const cellId = $(this).data('cellid');
        $(`#${cellId}-short`).hide();
        $(`#${cellId}-full`).show();
    });
    $(`.table-container[data-table-id="${tableId}"] .collapse-stacktrace`).off('click').on('click', function(e) {
        e.preventDefault();
        const cellId = $(this).data('cellid');
        $(`#${cellId}-full`).hide();
        $(`#${cellId}-short`).show();
    });
}

// Pagination for individual sections
function updatePaginationForSection(tableId, totalItems, currentPage, pageSize) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    
    $(`.prev-page[data-table-id="${tableId}"]`).prop('disabled', currentPage <= 1);
    $(`.next-page[data-table-id="${tableId}"]`).prop('disabled', currentPage >= totalPages);
    $(`.page-info[data-table-id="${tableId}"]`).text(`Page ${currentPage} of ${totalPages} (${start}-${end} of ${totalItems} entries)`);
}

// Search count for individual sections
function updateSearchCountForSection(tableId, showing, total, searchValue) {
    const searchCountElement = $(`.search-count[data-table-id="${tableId}"] small`);
    if (searchValue) {
        searchCountElement.text(`Showing ${showing} of ${total} results`);
    } else {
        searchCountElement.text('');
    }
}

// Legacy functions for backward compatibility (will be removed)
 