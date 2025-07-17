//orchestrates event bindings and high-level flow and depends on other js modules
const PAGE_SIZE = 5;

// Table section management
let currentTableId = 0;

function getNextTableId() {
    return ++currentTableId;
}

function getPaginatedData(data, page, size) {
    const start = (page - 1) * size;
    const end = start + size;
    return data.slice(start, end);
}

$(document).ready(function() {
    // Initial table: Active Error Summary
    showLoader();
    fetchActiveErrorSummary().done(function(data) {
        const tableId = getNextTableId();
        createTableSection(tableId, 'Active Error Summary', data, { hashLink: true });
        hideLoader();
    }).fail(function() {
        $('#tables-container').html('<p style="color:red;">Failed to load data.</p>');
        hideLoader();
    });

    // Hash link (Active Error Summary → Streams for Error Hash)
    $(document).on('click', '.hash-link', function(e) {
        e.preventDefault();
        const hash = $(this).data('hash');
        const parentTableId = $(this).closest('.table-section').find('.table-container').data('table-id');
        
        // Remove child tables of the parent
        removeChildTables(parentTableId);
        
        showLoader();
        fetchStreamsForHash(hash).done(function(data) {
            const tableId = getNextTableId();
            createTableSection(tableId, 'Streams affected by Error Hash', data, { streamIdLink: true });
            hideLoader();
        }).fail(function() {
            hideLoader();
        });
    });

    // Stream link (Streams for Error Hash → Errors for Stream)
    $(document).on('click', '.stream-link', function(e) {
        e.preventDefault();
        const streamId = $(this).data('streamid');
        const parentTableId = $(this).closest('.table-section').find('.table-container').data('table-id');
        
        // Remove child tables of the parent
        removeChildTables(parentTableId);
        
        showLoader();
        fetchStreamsForStreamId(streamId).done(function(data) {
            const filtered = (data || []).filter(row => row.errorId !== null && row.errorId !== undefined);
            const tableId = getNextTableId();
            createTableSection(tableId, 'Errors for Stream', filtered, { errorIdLink: true });
            hideLoader();
        }).fail(function() {
            hideLoader();
        });
    });

    // Error link (Errors for Stream → Error Details)
    $(document).on('click', '.error-link', function(e) {
        e.preventDefault();
        const streamId = $(this).data('streamid');
        const errorId = $(this).data('errorid');
        const parentTableId = $(this).closest('.table-section').find('.table-container').data('table-id');
        
        // Remove child tables of the parent
        removeChildTables(parentTableId);
        
        showLoader();
        fetchErrorDetails(errorId).done(function(data) {
            const tableId = getNextTableId();
            const errorData = Array.isArray(data) ? data : [data];
            createTableSection(tableId, 'Error Details', errorData, { errorDetails: true });
            hideLoader();
        }).fail(function() {
            hideLoader();
        });
    });

    // Search handler for individual tables
    $(document).on('input', '.table-search', function() {
        const tableId = $(this).data('table-id');
        const searchValue = $(this).val();
        const section = tableSections.find(s => s.id === tableId);
        
        if (!section) return;
        
        section.searchValue = searchValue;
        section.currentPage = 1;
        
        if (!searchValue) {
            section.filteredData = section.data;
        } else {
            section.filteredData = filterTableData(section.data, searchValue, section.options || {});
        }
        
        renderTableForSection(tableId, section.filteredData, section.options);
        updatePaginationForSection(tableId, section.filteredData.length, 1, PAGE_SIZE);
        updateSearchCountForSection(tableId, section.filteredData.length, section.data.length, searchValue);
    });

    // Pagination handlers for individual tables
    $(document).on('click', '.prev-page', function() {
        const tableId = $(this).data('table-id');
        const section = tableSections.find(s => s.id === tableId);
        
        if (section && section.currentPage > 1) {
            section.currentPage--;
            renderTableForSection(tableId, section.filteredData, section.options);
            updatePaginationForSection(tableId, section.filteredData.length, section.currentPage, PAGE_SIZE);
        }
    });

    $(document).on('click', '.next-page', function() {
        const tableId = $(this).data('table-id');
        const section = tableSections.find(s => s.id === tableId);
        
        if (section) {
            const totalPages = Math.ceil(section.filteredData.length / PAGE_SIZE);
            if (section.currentPage < totalPages) {
                section.currentPage++;
                renderTableForSection(tableId, section.filteredData, section.options);
                updatePaginationForSection(tableId, section.filteredData.length, section.currentPage, PAGE_SIZE);
            }
        }
    });
}); 