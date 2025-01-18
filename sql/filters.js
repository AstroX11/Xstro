import fs from 'fs';
import path from 'path';

const store = path.join('store', 'filters.json');

if (!fs.existsSync(store)) {
  fs.writeFileSync(store, JSON.stringify([], null, 2));
}

const readFilters = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeFilters = (filters) => fs.writeFileSync(store, JSON.stringify(filters, null, 2));

/**
 * Adds a DM or GC filter to the JSON-based database.
 * @param {string} type - The filter type ('dm' or 'gc')
 * @param {string} text - The trigger text for the filter.
 * @param {string} response - The response for the filter.
 * @returns {Promise<string>} - A success message.
 */
export async function addFilter(type, text, response) {
  const fullText = `${type}:${text}`;
  const filters = readFilters();

  // Check if the filter already exists
  const existingFilter = filters.find((filter) => filter.text === fullText);
  if (existingFilter) {
    return `${type.toUpperCase()} filter '${text}' already exists.`;
  }

  // Add new filter
  filters.push({ text: fullText, response });
  writeFilters(filters);
  return `${type.toUpperCase()} filter '${text}' added successfully.`;
}

/**
 * Removes a filter from the JSON-based database.
 * @param {string} type - The filter type ('dm' or 'gc')
 * @param {string} text - The trigger text of the filter to remove.
 * @returns {Promise<string>} - A success or failure message.
 */
export async function removeFilter(type, text) {
  const fullText = `${type}:${text}`;
  const filters = readFilters();

  // Find and remove the filter
  const index = filters.findIndex((filter) => filter.text === fullText);
  if (index === -1) {
    return `${type.toUpperCase()} filter '${text}' does not exist.`;
  }

  filters.splice(index, 1); // Remove the filter
  writeFilters(filters);
  return `${type.toUpperCase()} filter '${text}' removed successfully.`;
}

/**
 * Retrieves filters for a specific type from the filters database.
 * @param {string} type - The type of filter to retrieve, either 'dm' (direct message) or 'gc' (group chat).
 * @returns {Promise<Array<{ word: string, response: string }>>} An array of filters matching the specified type, with each filter containing the trigger word and its corresponding response.
 * @throws {Error} If there's an issue reading the filters file.
 */
export async function getFilters(type) {
  const filters = readFilters();
  return filters
    .filter((filter) => filter.text.startsWith(`${type}:`))
    .map((filter) => ({
      word: filter.text.replace(`${type}:`, ''),
      response: filter.response,
    }));
}
