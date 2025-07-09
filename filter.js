// filter.js

function filterTableData(data, searchValue, options = {}) {
    if (!searchValue) return data;
    const lower = searchValue.toLowerCase();
    // For error details table, flatten nested fields
    if (options.errorDetails) {
        return data.filter(row => {
            return Object.entries(row).some(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    return Object.values(value).some(v => {
                        if (typeof v === 'boolean') return v.toString().toLowerCase().includes(lower);
                        return v && v.toString().toLowerCase().includes(lower);
                    });
                }
                if (typeof value === 'boolean') return value.toString().toLowerCase().includes(lower);
                return value && value.toString().toLowerCase().includes(lower);
            });
        });
    } else {
        return data.filter(row => {
            return Object.values(row).some(v => {
                if (typeof v === 'boolean') return v.toString().toLowerCase().includes(lower);
                return v && v.toString().toLowerCase().includes(lower);
            });
        });
    }
} 