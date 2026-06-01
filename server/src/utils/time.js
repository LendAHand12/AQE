/**
 * Time Utilities
 * The system timezone is set to America/Chicago (CST/CDT).
 */

// Helper: Get current time in system timezone (CST/CDT)
export const getSystemTime = (date = new Date()) => {
    return new Date(date.toLocaleString("en-US", { timeZone: "America/Chicago" }));
};

// Helper: Get start of day (midnight) in system timezone
export const getStartOfDay = (date = new Date()) => {
    const d = new Date(date.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    d.setHours(0, 0, 0, 0);
    return d;
};
