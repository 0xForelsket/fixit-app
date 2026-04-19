export function calculateNextScheduleDueDate(
  frequencyDays: number,
  fromDate: Date = new Date()
): Date {
  const nextDue = new Date(fromDate);
  nextDue.setDate(nextDue.getDate() + frequencyDays);
  return nextDue;
}
