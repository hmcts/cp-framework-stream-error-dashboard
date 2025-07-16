function fetchActiveErrorSummary() {
    return $.getJSON('/internal/errors/active-summary');
}

function fetchStreamsForHash(hash) {
    return $.getJSON('/internal/streams?errorHash=' + encodeURIComponent(hash));
}

function fetchStreamsForStreamId(streamId) {
    return $.getJSON('/internal/streams?streamId=' + encodeURIComponent(streamId));
}

function fetchErrorDetails(errorId) {
    return $.getJSON('/internal/stream-errors?errorId=' + encodeURIComponent(errorId));
} 