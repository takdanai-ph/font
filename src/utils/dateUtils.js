export const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        // ใช้ th-TH locale เพื่อแสดงผลวันที่แบบไทย
        return date.toLocaleString('th-TH', options);
    } catch (error) { return 'Invalid Date'; }
};

export const isOverdue = (dueDateString) => {
    if (!dueDateString) return false;
    try {
        const dueDate = new Date(dueDateString);
        const now = new Date();

        const comparisonDate = new Date();

        return dueDate < comparisonDate;
    } catch (e) {
        return false;
    }
};