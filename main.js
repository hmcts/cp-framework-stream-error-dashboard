//orchestrates event bindings and high-level flow and depends on other js modules
const PAGE_SIZE = 10;
let lastTableOptions = null;
let lastTableHeading = '';
let originalTableData = null;
let currentPage = 1;
let paginatedData = null;

function getPaginatedData(data, page, size) {
    const start = (page - 1) * size;
    const end = start + size;
    return data.slice(start, end);
}

function renderTableWithHeading(heading, data, options = {}) {
    lastTableOptions = options;
    lastTableHeading = heading;
    paginatedData = data;
    currentPage = 1;
    $('#table-heading').text(heading);
    renderTable(getPaginatedData(data, currentPage, PAGE_SIZE), options);
    updatePaginationControls(data.length, currentPage, PAGE_SIZE);
}

function loadTableFromNav(nav) {
    if (!nav) return;
    showLoader();
    $.getJSON(nav.url, function(data) {
        let renderData = data;
        if (nav.options && nav.options.errorIdLink) {
            renderData = (data || []).filter(row => row.errorId !== null && row.errorId !== undefined);
        }
        originalTableData = renderData;
        lastTableOptions = nav.options;
        lastTableHeading = nav.heading;
        renderTableWithHeading(nav.heading, renderData, nav.options);
        showBackLink(hasBack());
        hideLoader();
    }).fail(function() {
        $('#table-heading').text(nav.heading);
        $('#table-container').html('<p style="color:red;">Failed to load data.</p>');
        showBackLink(hasBack());
        hideLoader();
    });
}

function showBackLink(show) {
    if (show) {
        $('#back-link').show();
    } else {
        $('#back-link').hide();
    }
}

$(document).ready(function() {
    // Initial table: Active Error Summary
    clearNavigation();
    showBackLink(false);
    showLoader();
    fetchActiveErrorSummary().done(function(data) {
        originalTableData = data;
        lastTableOptions = { hashLink: true };
        lastTableHeading = 'Active Error Summary';
        renderTableWithHeading('Active Error Summary', data, { hashLink: true });
        showBackLink(false);
        hideLoader();
    }).fail(function() {
        $('#table-heading').text('Active Error Summary');
        $('#table-container').html('<p style="color:red;">Failed to load data.</p>');
        showBackLink(false);
        hideLoader();
    });

    // Home link handler
    $('#home-link').on('click', function(e) {
        e.preventDefault();
        location.reload();
    });

    // Back link handler
    $('#back-link').on('click', function(e) {
        e.preventDefault();
        if (hasBack()) {
            const prevNav = popNavigation();
            loadTableFromNav(prevNav);
        }
    });

    // Hash link (error summary → streams)
    $('#table-container').on('click', '.hash-link', function(e) {
        e.preventDefault();
        const hash = $(this).data('hash');
        setCurrentHash(hash);
        pushNavigation({
            url: '/internal/errors/active-summary',
            heading: 'Active Error Summary',
            options: { hashLink: true }
        });
        showLoader();
        fetchStreamsForHash(hash).done(function(data) {
            originalTableData = data;
            lastTableOptions = { streamIdLink: true };
            lastTableHeading = 'Streams for Error Hash';
            renderTableWithHeading('Streams for Error Hash', data, { streamIdLink: true });
            showBackLink(hasBack());
            hideLoader();
        }).fail(function() {
            $('#table-heading').text('Streams for Error Hash');
            $('#table-container').html('<p style=\"color:red;\">Failed to load data.</p>');
            showBackLink(hasBack());
            hideLoader();
        });
    });

    // Stream link (streams → errors for stream)
    $('#table-container').on('click', '.stream-link', function(e) {
        e.preventDefault();
        const streamId = $(this).data('streamid');
        pushNavigation({
            url: '/internal/streams?errorHash=' + encodeURIComponent(getCurrentHash() || ''),
            heading: 'Streams for Error Hash',
            options: { streamIdLink: true }
        });
        showLoader();
        fetchStreamsForStreamId(streamId).done(function(data) {
            const filtered = (data || []).filter(row => row.errorId !== null && row.errorId !== undefined);
            originalTableData = filtered;
            lastTableOptions = { errorIdLink: true };
            lastTableHeading = 'Errors for Stream';
            renderTableWithHeading('Errors for Stream', filtered, { errorIdLink: true });
            showBackLink(hasBack());
            hideLoader();
        }).fail(function() {
            $('#table-heading').text('Errors for Stream');
            $('#table-container').html('<p style=\"color:red;\">Failed to load data.</p>');
            showBackLink(hasBack());
            hideLoader();
        });
    });

    // Error link (errors for stream → error details)
    $('#table-container').on('click', '.error-link', function(e) {
        e.preventDefault();
        const streamId = $(this).data('streamid');
        const errorId = $(this).data('errorid');
        pushNavigation({
            url: '/internal/streams?streamId=' + encodeURIComponent(streamId),
            heading: 'Errors for Stream',
            options: { errorIdLink: true }
        });
        showLoader();
        fetchErrorDetails(streamId).done(function(data) {
            lastTableOptions = { errorDetails: true };
            lastTableHeading = 'Error Details';
            renderErrorDetailsTable(data);
            showBackLink(hasBack());
            hideLoader();
        }).fail(function() {
            $('#table-heading').text('Error Details');
            $('#table-container').html('<p style=\"color:red;\">Failed to load data.</p>');
            showBackLink(hasBack());
            hideLoader();
        });
    });

    // Search handler
    $('#table-search').on('input', function() {
        const searchValue = $(this).val();
        if (!originalTableData) return;
        const filtered = filterTableData(originalTableData, searchValue, lastTableOptions || {});
        paginatedData = filtered;
        currentPage = 1;
        if (lastTableOptions && lastTableOptions.errorDetails) {
            renderErrorDetailsTable(filtered);
        } else {
            renderTableWithHeading(lastTableHeading, filtered, lastTableOptions || {});
        }
        updateSearchCount(filtered.length, originalTableData.length, searchValue);
    });

    // Pagination handlers
    $('#prev-page').on('click', function() {
        if (currentPage > 1 && paginatedData) {
            currentPage--;
            if (lastTableOptions && lastTableOptions.errorDetails) {
                renderErrorDetailsTable(paginatedData);
            } else {
                renderTable(getPaginatedData(paginatedData, currentPage, PAGE_SIZE), lastTableOptions || {});
            }
            updatePaginationControls(paginatedData.length, currentPage, PAGE_SIZE);
        }
    });
    $('#next-page').on('click', function() {
        if (paginatedData) {
            const totalPages = Math.ceil(paginatedData.length / PAGE_SIZE);
            if (currentPage < totalPages) {
                currentPage++;
                if (lastTableOptions && lastTableOptions.errorDetails) {
                    renderErrorDetailsTable(paginatedData);
                } else {
                    renderTable(getPaginatedData(paginatedData, currentPage, PAGE_SIZE), lastTableOptions || {});
                }
                updatePaginationControls(paginatedData.length, currentPage, PAGE_SIZE);
            }
        }
    });
}); 