/** Date formatting for the chart, always in Moscow time. */

export function fmtFull(timestamp) {
  const date = new Date(timestamp);
  const day = date.toLocaleDateString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'short',
  });
  const time = date.toLocaleTimeString('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${day}, ${time} МСК`;
}

export function fmtTick(timestamp, rangeId) {
  const date = new Date(timestamp);
  if (['6h', '12h', '24h'].includes(rangeId)) {
    return date.toLocaleTimeString('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'short',
  });
}
