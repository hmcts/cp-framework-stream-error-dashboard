// ui.js

// Loader
function showLoader() {
    $('#loader').show();
}
function hideLoader() {
    $('#loader').hide();
}

// Table rendering
function renderTable(data, options = {}) {
    if (!Array.isArray(data) || data.length === 0) {
        $('#table-container').html('<p>No data available.</p>');
        return;
    }
    const columns = options.columns || Object.keys(data[0]);
    let table = '<div class="table-responsive"><table class="table table-striped table-hover table-bordered align-middle">';
    table += '<thead class="table-info"><tr>';
    columns.forEach(col => {
        table += `<th scope=\"col\">${col}</th>`;
    });
    table += '</tr></thead><tbody>';
    data.forEach(row => {
        table += '<tr>';
        columns.forEach(col => {
            if (options.hashLink && col === 'hash' && row[col]) {
                table += `<td><a href=\"#\" class=\"hash-link\" data-hash=\"${row[col]}\">${row[col]}</a></td>`;
            } else if (options.errorIdLink && col === 'errorId' && row[col]) {
                table += `<td><a href=\"#\" class=\"error-link\" data-streamid=\"${row['streamId']}\" data-errorid=\"${row[col]}\">${row[col]}</a></td>`;
            } else if (col === 'streamId' && row[col] && options.streamIdLink) {
                table += `<td><a href=\"#\" class=\"stream-link\" data-streamid=\"${row[col]}\">${row[col]}</a></td>`;
            } else {
                table += `<td class=\"align-top\">${row[col] !== null ? row[col] : ''}</td>`;
            }
        });
        table += '</tr>';
    });
    table += '</tbody></table></div>';
    $('#table-container').html(table);
}

// Error details table rendering (special fields, stack trace, etc.)
function renderErrorDetailsTable(data, heading = 'Error Details') {
    // Update the table heading
    $('#table-heading').text(heading);
    
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
        table += `<th scope=\"col\">${f}</th>`;
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
                const cellId = `stacktrace-cell-${rowIdx}`;
                table += `<td class=\"align-top\" style=\"word-break:break-all;\">`;
                table += `<div id=\"${cellId}-short\">${shortText}${isLong ? '<br><a href=\"#\" class=\"expand-stacktrace\" data-cellid=\"' + cellId + '\">see full details</a>' : ''}</div>`;
                if (isLong) {
                    table += `<div id=\"${cellId}-full\" style=\"display:none;\">${lines.join('<br>')}<br><a href=\"#\" class=\"collapse-stacktrace\" data-cellid=\"${cellId}\">show less</a></div>`;
                }
                table += `</td>`;
            } else {
                table += `<td class=\"align-top\" style=\"word-break:break-all;\">${value !== null ? value : ''}</td>`;
            }
        });
        table += '</tr>';
    });
    table += '</tbody></table></div>';
    $('#table-container').html(table);

    // Add expand/collapse handlers
    $('.expand-stacktrace').off('click').on('click', function(e) {
        e.preventDefault();
        const cellId = $(this).data('cellid');
        $(`#${cellId}-short`).hide();
        $(`#${cellId}-full`).show();
    });
    $('.collapse-stacktrace').off('click').on('click', function(e) {
        e.preventDefault();
        const cellId = $(this).data('cellid');
        $(`#${cellId}-full`).hide();
        $(`#${cellId}-short`).show();
    });
}

// Pagination
function updatePaginationControls(totalItems, currentPage, pageSize) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    $('#prev-page').prop('disabled', currentPage <= 1);
    $('#next-page').prop('disabled', currentPage >= totalPages);
    $('#page-info').text(`Page ${currentPage} of ${totalPages} (${start}-${end} of ${totalItems})`);
}

// Search count
function updateSearchCount(showing, total, searchValue) {
    if (searchValue) {
        $('#search-count small').text(`Showing ${showing} of ${total} results`);
    } else {
        $('#search-count small').text('');
    }
} 