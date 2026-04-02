/**
 * Check if a branch is open based on its operating hours.
 * @param {Object} operatingHours - The operating hours from the Location model.
 * @returns {Boolean} - True if open, false if closed.
 */
const isBranchOpen = (operatingHours) => {
  if (!operatingHours) return true; // Default to open if no hours set

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[now.getDay()];
  
  const dayHours = operatingHours[dayName];
  if (!dayHours || dayHours.isClosed) return false;

  // If both open and close times are missing, assume closed if isClosed is true
  if (!dayHours.open || !dayHours.close) return !dayHours.isClosed;

  const [nowHours, nowMinutes] = [now.getHours(), now.getMinutes()];
  const currentTime = nowHours * 60 + nowMinutes;
  
  const [openHours, openMinutes] = dayHours.open.split(':').map(Number);
  const [closeHours, closeMinutes] = dayHours.close.split(':').map(Number);
  
  const openTime = openHours * 60 + openMinutes;
  const closeTime = closeHours * 60 + closeMinutes;
  
  // Handle overnight hours (e.g., 22:00 to 02:00)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime < closeTime;
  }
  
  return currentTime >= openTime && currentTime < closeTime;
};

module.exports = { isBranchOpen };
