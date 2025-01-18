import fs from 'fs';
import path from 'path';

const store = path.join('store', 'schedules.json');

if (!fs.existsSync(store)) {
  fs.writeFileSync(store, JSON.stringify([], null, 2));
}

const readSchedules = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeSchedules = (schedules) => fs.writeFileSync(store, JSON.stringify(schedules, null, 2));

/**
 * Adds or updates a schedule for a specific group in the schedules JSON file.
 * 
 * @param {string} groupId - Unique identifier for the group to schedule.
 * @param {string} muteTime - Timestamp or time string when the group should be muted.
 * @param {string} unmuteTime - Timestamp or time string when the group should be unmuted.
 * @param {boolean} [isMuted=false] - Current mute status of the group. Defaults to false.
 * @param {boolean} [isScheduled=false] - Whether the schedule is currently active. Defaults to false.
 * @returns {Promise<Object>} The newly created or updated schedule object.
 * @throws {Error} Potential errors during file read/write operations.
 */
export async function addOrUpdateSchedule(
  groupId,
  muteTime,
  unmuteTime,
  isMuted = false,
  isScheduled = false
) {
  const schedules = readSchedules();
  let schedule = schedules.find((schedule) => schedule.groupId === groupId);

  if (schedule) {
    // Update existing schedule
    schedule.muteTime = muteTime;
    schedule.unmuteTime = unmuteTime;
    schedule.isMuted = isMuted;
    schedule.isScheduled = isScheduled;
  } else {
    // Add new schedule
    schedule = { groupId, muteTime, unmuteTime, isMuted, isScheduled };
    schedules.push(schedule);
  }

  writeSchedules(schedules);
  return schedule;
}

/**
 * Retrieves a schedule by groupId.
 * @param {string} groupId - The ID of the group.
 * @returns {Promise<Object|null>} - The schedule for the group or null if not found.
 */
export async function getSchedule(groupId) {
  const schedules = readSchedules();
  return schedules.find((schedule) => schedule.groupId === groupId) || null;
}

/**
 * Removes a schedule for a specific group from the schedules file.
 * @param {string} groupId - The unique identifier of the group whose schedule is to be removed.
 * @returns {Promise<boolean>} Indicates whether the schedule was successfully removed.
 * @throws {Error} Potential errors during file read or write operations.
 */
export async function removeSchedule(groupId) {
  const schedules = readSchedules();
  const index = schedules.findIndex((schedule) => schedule.groupId === groupId);

  if (index === -1) {
    return false;
  }

  schedules.splice(index, 1);
  writeSchedules(schedules);
  return true;
}

/**
 * Retrieves all schedules from the JSON storage.
 * @returns {Promise<Array>} An array containing all stored group schedules. Returns an empty array if no schedules exist.
 * @throws {Error} Throws an error if there are issues reading the schedules file.
 */
export async function getAllSchedules() {
  return readSchedules();
}
