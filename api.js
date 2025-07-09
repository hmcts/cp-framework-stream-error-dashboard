function fetchActiveErrorSummary() {
    return $.getJSON('/internal/errors/active-summary');
}

function fetchStreamsForHash(hash) {
    return $.getJSON('/internal/streams?errorHash=' + encodeURIComponent(hash));
}

function fetchStreamsForStreamId(streamId) {
    return $.getJSON('/internal/streams?streamId=' + encodeURIComponent(streamId));
}

function fetchErrorDetails(streamId) {
    return $.getJSON('/internal/stream-errors?streamId=' + encodeURIComponent(streamId));
} 