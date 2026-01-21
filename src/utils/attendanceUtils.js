import dayjs from "dayjs";

/**
 * Build a month attendance map like:
 * { "2024-11-01": "present" | "absent" | "today" }
 */
export function generateMonthAttendance(year, month /* 1-12 */) {
    const start = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    const daysInMonth = start.daysInMonth();
    const map = {};

    // Simple demo logic: present by default, mark some weekends/indices absent
    const absentDays = new Set([2, 9, 16, 24]); // example (dates)
    for (let d = 1; d <= daysInMonth; d++) {
        const date = start.date(d);
        const key = date.format("YYYY-MM-DD");

        if (date.isSame(dayjs(), "day")) {
            map[key] = "today";
        } else if (absentDays.has(d) || date.day() === 0) {
            map[key] = "absent";
        } else {
            map[key] = "present";
        }
    }

    return map;
}

export function summarize(map) {
    let present = 0, absent = 0, today = 0;
    Object.values(map).forEach(v => {
        if (v === "present") present++;
        if (v === "absent") absent++;
        if (v === "today") today++;
    });
    const total = present + absent + today;
    const attendanceRate = total ? Math.round(((present + today) / total) * 100) : 0;

    return { present, absent, today, attendanceRate };
}
