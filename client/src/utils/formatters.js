export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'GH₵0.00';
  return `GH₵${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatWeight = (qty, unit = 'kg') => {
  if (qty === undefined || qty === null || isNaN(qty)) return `0 ${unit}`;
  return `${Number(qty).toLocaleString('en-US')} ${unit}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
