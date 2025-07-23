# Error Dashboard User Guide

## Overview

The Error Dashboard is a real-time monitoring and analysis tool for stream processing errors within the CP Microservice Framework. It provides a comprehensive view of active errors, affected streams, and detailed error information to help teams quickly identify and resolve issues.

## Features

- **Real-time Error Monitoring**: View active error types and their impact across the system
- **Stream Analysis**: Drill down from error types to specific affected streams
- **Error Details**: View comprehensive error information including stack traces and JSON payloads
- **Interactive Navigation**: Click through error hashes, stream IDs, and error IDs for detailed analysis
- **Search and Filtering**: Search within tables and filter data
- **JSON Pretty Print**: Automatically format and display JSON payloads with toggle functionality
- **Responsive Design**: Works across different screen sizes

## Table Structure

### 1. Active Error Summary
The main dashboard view showing all active error types in the system.

**Columns:**
- **Error Hash** (?) - Unique Error Tag used to group similar errors
- **Streams Affected** (?) - No of Streams affected by this type of Error currently
- **Events Affected** (?) - Total no of events across all streams affected by this type of Error
- **Error Location - Class** (?) - This is location or java class or file name where the error has occurred
- **Error Location - Method** (?) - The method within the java class where the error has occurred
- **Error Location - Line No** (?) - The line number where the error occurred
- **exceptionClassName** (?) - The underlying system or lower level exception
- **causeClassName** (?) - The cause of the underlying lower level exception

### 2. Streams affected by Error Hash
Shows all streams currently affected by a specific error hash.

**Columns:**
- **Stream ID** - Unique identifier for the stream
- **Position** - Current processing position in the stream
- **Last Known Position** - Latest known position of the stream
- **Source/Service** - Source system for the stream
- **Component** - Component processing the stream
- **Updated At** - Last update timestamp
- **Is Upto Date** - Whether stream is Fresh (processed all events after framework D upgrade)
- **Error ID** - Reference to active error
- **Error Position** - Position where error occurred

### 3. Errors for Stream
Displays all errors (active or historical) for a given stream.

### 4. Error Details
Comprehensive error information including stack traces and JSON payloads.

## Navigation Flow

1. **Start**: Active Error Summary table
2. **Click Error Hash**: Navigate to "Streams affected by Error Hash"
3. **Click Stream ID**: Navigate to "Errors for Stream"
4. **Click Error ID**: Navigate to "Error Details"

## API Endpoints

All endpoints are under the `/internal` namespace.

### 1. Get Active Error Types and Impact
**Purpose**: Identify different types of active errors and their impact on streams and events.

**Endpoint**: `GET /internal/errors/active-summary`

**Query Parameters** (Optional):
- `component` - Filter by component
- `source` - Filter by source

**Response**:
```json
[
  {
    "hash": "abc123",
    "exceptionClassName": "java.sql.SQLException",
    "causeClassName": "java.net.SocketTimeoutException",
    "javaClassName": "java.net.SocketTimeoutException",
    "javaMethod": "java.net.SocketTimeoutException",
    "noOfAffectedStreams": 5,
    "noOfAffectedEvents": 12
  }
]
```

### 2. Get Streams Affected by a Specific Error
**Purpose**: List all streams currently affected by a given error hash or get stream details.

**Endpoint**: `GET /internal/streams`

**Query Parameters** (Only one is mandatory):
- `errorHash` - Error hash
- `streamId` - UUID of stream
- `hasError` - true/false

**Sort**: By `updatedAt` desc

**Response**:
```json
[
  {
    "streamId": "stream-1",
    "component": "event-processor",
    "source": "source-A",
    "position": 1,
    "lastKnownPosition": 2,
    "upToDate": false,
    "updatedAt": "2024-06-01T12:34:56Z",
    "errorId": "error-id",
    "errorPosition": "error-id"
  }
]
```

### 3. Get Stream Errors
**Purpose**: List all errors for a given stream or get error details for a given error ID.

**Endpoint**: `GET /internal/stream-errors`

**Query Parameters** (Only one must be supplied):
- `streamId` - UUID of stream
- `errorId` - UUID of error

**Response**:
```json
[
  {
    "streamErrorDetails": {
      "id": "41a14e88-4151-4a37-bc78-b5b27b67b33f",
      "hash": "some-hash-1",
      "exceptionMessage": "exception-message-1",
      "eventName": "some-event-name-1",
      "eventId": "12321a93-b955-439d-9f64-f9ba6c70e37d",
      "streamId": "b8c14c11-476c-425d-9161-7b834ff379ec",
      "positionInStream": 23,
      "dateCreated": "2025-06-30T21:22:00.000Z",
      "fullStackTrace": "stack-trace-1",
      "componentName": "some-component",
      "source": "some-source"
    },
    "streamErrorHash": {
      "hash": "some-hash",
      "exceptionClassName": "exception-class-name",
      "javaClassName": "java-class-name",
      "javaMethod": "java-method",
      "javaLineNumber": 76
    }
  }
]
```

## Data Model

### Core Business Concepts

#### 1. Event Stream
- **Definition**: A sequence of events processed in order
- **Characteristics**: Unique identifier, sequential positions, multiple components, different sources

#### 2. Stream Error
- **Definition**: An error during event processing in a stream
- **Characteristics**: Associated with specific event/position, detailed error information, unique hash

#### 3. Error Type (Error Hash)
- **Definition**: Classification of errors based on characteristics
- **Characteristics**: Unique hash, exception/cause information, Java method/line details

#### 4. Stream Status
- **Definition**: Current state of stream processing
- **Characteristics**: Current position, up-to-date status, active error reference

#### 5. Stream Statistics
- **Definition**: Aggregated metrics about stream processing
- **Characteristics**: Counts of different states (blocked, unblocked, stale, fresh)

### Database Tables

#### 1. stream_error Table
Stores individual error instances during event stream processing.

**Key Attributes**:
- `id` (UUID, PK) - Unique identifier
- `hash` (VARCHAR(255), FK) - Reference to error type
- `exception_message` (TEXT) - Human-readable error message
- `cause_message` (TEXT) - Underlying cause
- `event_name` (VARCHAR(255)) - Event name
- `event_id` (UUID) - Event identifier
- `stream_id` (UUID) - Stream where error occurred
- `position_in_stream` (BIGINT) - Event position
- `date_created` (TIMESTAMP) - When error was recorded
- `full_stack_trace` (TEXT) - Complete Java stack trace
- `component` (VARCHAR(100)) - Component that encountered error
- `source` (VARCHAR(100)) - Source system

#### 2. stream_error_hash Table
Classifies and groups similar errors for analysis.

**Key Attributes**:
- `hash` (VARCHAR(255), PK) - Unique hash identifying error type
- `exception_classname` (TEXT) - Java exception class name
- `cause_classname` (TEXT) - Java cause exception class name
- `java_classname` (TEXT) - Java class where error occurred
- `java_method` (TEXT) - Java method where error occurred
- `java_line_number` (BIGINT) - Line number in source code

#### 3. stream_status Table
Tracks current processing state of each stream.

**Key Attributes**:
- `stream_id` (UUID, PK) - Unique stream identifier
- `position` (BIGINT) - Current processing position
- `source` (VARCHAR(100)) - Source system
- `component` (VARCHAR(100)) - Component processing stream
- `stream_error_id` (UUID, FK) - Reference to active error
- `stream_error_position` (BIGINT) - Position where error occurred
- `updated_at` (TIMESTAMP) - Last update timestamp
- `latest_known_position` (BIGINT) - Latest known position
- `is_up_to_date` (BOOLEAN) - Whether stream is Fresh

#### 4. stream_statistic Table
Stores aggregated statistics for monitoring.

**Key Attributes**:
- `source` (VARCHAR(255), PK) - Source system identifier
- `component` (VARCHAR(255), PK) - Component identifier
- `updated_at` (TIMESTAMP) - Last statistics update
- `total_count` (BIGINT) - Total number of streams
- `blocked_count` (BIGINT) - Number of streams blocked by errors
- `unblocked_count` (BIGINT) - Number of streams not blocked
- `stale_count` (BIGINT) - Number of stale streams
- `fresh_count` (BIGINT) - Number of fresh streams

## Business Rules

### Error Classification Rules
- Error hash generated based on exception class, cause class, and code location
- Same error type can occur multiple times across different streams
- Error hash must exist before creating stream_error records

### Stream Status Rules
- Each stream-component-source combination has exactly one status record
- When `is_up_to_date = false`, `stream_error_id` must be populated
- When `is_up_to_date = true`, `stream_error_id` should be null
- Position should never exceed `latest_known_position`

### Error Lifecycle Rules
- Errors created when processing fails
- Errors become active when they block stream processing
- Errors resolved when processing resumes
- Historical error records retained for analysis

### Statistics Aggregation Rules
- Statistics updated based on current stream statuses
- `blocked_count + unblocked_count = total_count`
- `stale_count + fresh_count = total_count`
- Statistics maintained per component-source combination

## How the Error Dashboard Uses the Endpoints

### 1. Initial Load
- Calls `/internal/errors/active-summary` to populate the Active Error Summary table
- Displays error types with their impact metrics

### 2. Error Hash Navigation
- When user clicks on an Error Hash link
- Calls `/internal/streams?errorHash=<hash>` to get affected streams
- Displays "Streams affected by Error Hash" table

### 3. Stream Navigation
- When user clicks on a Stream ID link
- Calls `/internal/streams?streamId=<uuid>` to get stream details
- Filters for streams with errors and displays "Errors for Stream" table

### 4. Error Details Navigation
- When user clicks on an Error ID link
- Calls `/internal/stream-errors?errorId=<uuid>` to get detailed error information
- Displays comprehensive error details including stack traces and JSON payloads

### 5. Search and Filtering
- Client-side filtering applied to loaded data
- Real-time search across table contents
- Pagination handled client-side for better performance

## Usage Instructions

### Getting Started
1. Open the Error Dashboard in your browser
2. The Active Error Summary table will load automatically
3. Review the error types and their impact metrics

### Investigating an Error
1. Click on an Error Hash in the Active Error Summary table
2. Review the affected streams in the "Streams affected by Error Hash" table
3. Click on a Stream ID to see specific errors for that stream
4. Click on an Error ID to view detailed error information

### Using Search
1. Use the search box in any table to filter results
2. Search is case-insensitive and works across all columns
3. Results update in real-time as you type

### Viewing JSON Data
1. JSON payloads are automatically detected and pretty-printed
2. Click "Show Raw" to see the original JSON format
3. Click "Show Pretty" to return to the formatted view

### Understanding Status Indicators
- **Fresh**: Stream is up-to-date with no issues
- **Stale**: Stream has missing events and entries in stream buffer table
- **Blocked**: Stream is blocked by an active error
- **Unblocked**: Stream is not blocked by errors

## Troubleshooting

### Common Issues
1. **No data displayed**: Check if the backend services are running
2. **Links not working**: Ensure all required endpoints are accessible
3. **JSON not formatting**: Verify the JSON payload is valid

### Error Messages
- **"Failed to load data"**: Backend service unavailable
- **"No data available"**: No records found for the current query
- **"Invalid JSON"**: JSON payload cannot be parsed

## Technical Notes

### Browser Compatibility
- Modern browsers with ES6 support
- Responsive design for mobile and desktop
- Requires JavaScript enabled

### Performance Considerations
- Data is loaded on-demand to minimize initial load time
- Pagination limits data transfer
- Client-side filtering provides fast search results

### Security
- All endpoints are under `/internal` namespace
- Access should be restricted to authorized users
- No sensitive data should be exposed in error messages

---

*This user guide covers the complete functionality of the Error Dashboard. For technical implementation details, refer to the source code and API documentation.* 