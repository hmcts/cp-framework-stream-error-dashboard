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
    
    // Smooth scroll to the newly created table section
    const newSection = $(`#section-${tableId}`);
    if (newSection.length > 0) {
        newSection[0].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
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
    
    // Define custom column order for Active Error Summary table
    let columns;
    if (options.hashLink) {
        // Custom order for Active Error Summary table
        const customOrder = [
            'hash',
            'affectedStreamsCount',
            'affectedEventsCount',
            'javaClassname',
            'javaMethod',
            'javaLineNumber',
            'exceptionClassname',
            'causeClassname'
        ];
        // Filter to only include columns that exist in the data
        columns = customOrder.filter(col => paginatedData[0] && paginatedData[0].hasOwnProperty(col));
        // Add any remaining columns that weren't in the custom order
        const remainingCols = Object.keys(paginatedData[0] || {}).filter(col => !customOrder.includes(col));
        columns = columns.concat(remainingCols);
    } else {
        columns = options.columns || Object.keys(paginatedData[0] || {});
    }

    let table = '<div class="table-responsive"><table class="table table-striped table-hover table-bordered align-middle">';
    table += '<thead class="table-info"><tr>';
    columns.forEach(col => {
        // Map column names for better display
        let displayName = col;
        let tooltipMessage = '';

        if (col === 'hash') {
            displayName = 'Error Hash';
            tooltipMessage = 'Unique Error Tag used to group similar errors';
        } else if (col === 'javaClassname') {
            displayName = 'Error Location - Class';
            tooltipMessage = 'This is location or java class or file name where the error has occured';
        } else if (col === 'javaMethod') {
            displayName = 'Error Location - Method';
            tooltipMessage = 'The method within the java class where the error has occurred';
        } else if (col === 'javaLineNumber') {
            displayName = 'Error Location - Line No';
            tooltipMessage = 'The line number where the error occurred';
        } else if (col === 'affectedStreamsCount') {
            displayName = 'Streams Affected';
            tooltipMessage = 'No of Streams affected by this type of Error currently';
        } else if (col === 'affectedEventsCount') {
            displayName = 'Events Affected';
            tooltipMessage = 'Total no of events accross all streams affected by this typ of Error';
        } else if (col === 'exceptionClassname') {
            tooltipMessage = 'The underlying system or lower level exception';
        } else if (col === 'causeClassname') {
            tooltipMessage = 'The cause of the underlying lower level exception';
        } else if (col === 'streamId') {
            displayName = 'Stream ID';
        } else if (col === 'position') {
            displayName = 'Position';
        } else if (col === 'lastKnownPosition') {
            displayName = 'Last Known Position';
        } else if (col === 'source') {
            displayName = 'Source/Service';
        } else if (col === 'component') {
            displayName = 'Component';
        } else if (col === 'updatedAt') {
            displayName = 'Updated At';
        } else if (col === 'upToDate') {
            displayName = 'Is Upto Date';
        } else if (col === 'errorId') {
            displayName = 'Error ID';
        } else if (col === 'errorPosition') {
            displayName = 'Error Position';
        }

        // Add information label with tooltip for Active Error Summary table
        if (options.hashLink && tooltipMessage) {
            table += `<th scope="col">${displayName} <span class="info-label" title="${tooltipMessage}">(?)</span></th>`;
        } else {
            table += `<th scope="col">${displayName}</th>`;
        }
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
                // Check if the value might be JSON and format it
                let displayValue = value !== null ? value : '';
                if (displayValue && typeof displayValue === 'string') {
                    // Try to detect JSON content
                    try {
                        const trimmed = displayValue.trim();
                        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                            const parsed = JSON.parse(trimmed);
                            const prettyJSON = JSON.stringify(parsed, null, 2);
                            const uniqueId = `json-${tableId}-${rowIdx}-${colIdx}`;

                            table += `<td class="align-top" style="word-break:break-all;">`;
                            table += `<div class="json-content">`;
                            table += `<div class="json-pretty" id="${uniqueId}-pretty">${prettyJSON}</div>`;
                            table += `<div class="json-raw" id="${uniqueId}-raw" style="display:none;">${displayValue}</div>`;
                            table += `<div class="mt-2">`;
                            table += `<span class="json-toggle" onclick="toggleJSON('${uniqueId}')">Show Raw</span>`;
                            table += `</div>`;
                            table += `</div>`;
                            table += `</td>`;
                        } else {
                            table += `<td class="align-top" style="word-break:break-all;">${displayValue}</td>`;
                        }
                    } catch (e) {
                        // Not valid JSON, display as is
                        table += `<td class="align-top" style="word-break:break-all;">${displayValue}</td>`;
                    }
                } else {
                    table += `<td class="align-top" style="word-break:break-all;">${displayValue}</td>`;
                }
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

// JSON Pretty Print Functions
function toggleJSON(uniqueId) {
    const prettyElement = document.getElementById(uniqueId + '-pretty');
    const rawElement = document.getElementById(uniqueId + '-raw');
    const toggleElement = event.target;

    if (prettyElement.style.display === 'none') {
        prettyElement.style.display = 'block';
        rawElement.style.display = 'none';
        toggleElement.textContent = 'Show Raw';
    } else {
        prettyElement.style.display = 'none';
        rawElement.style.display = 'block';
        toggleElement.textContent = 'Show Pretty';
    }
}

// Legacy functions for backward compatibility (will be removed)
 