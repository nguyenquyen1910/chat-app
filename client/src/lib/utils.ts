export function formatMessageTime(date: string) {
  return new Date(date).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getHourAndMinute(date: string) {
  return new Date(date).getHours() + ":" + new Date(date).getMinutes();
}
