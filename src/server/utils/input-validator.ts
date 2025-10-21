/**
 * Input validation utilities for API endpoints
 * Validates and sanitizes user inputs to prevent injection and ensure data integrity
 */

/**
 * Valid care action types
 */
const VALID_CARE_ACTIONS = ['feed', 'play', 'attention'] as const;
export type CareAction = (typeof VALID_CARE_ACTIONS)[number];

/**
 * Valid mutation categories
 */
const VALID_MUTATION_CATEGORIES = [
  'legs',
  'color',
  'size',
  'appendage',
  'pattern',
  'texture',
  'eyes',
  'wings',
  'tail',
  'horns',
  'scales',
  'fur',
] as const;

/**
 * Valid biome types
 */
const VALID_BIOMES = ['jungle', 'rocky_mountain', 'desert', 'ocean', 'cave'] as const;

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate care action type
 * @param action Action to validate
 * @returns Validated action
 * @throws ValidationError if invalid
 */
export function validateCareAction(action: unknown): CareAction {
  if (typeof action !== 'string') {
    throw new ValidationError('Care action must be a string');
  }

  if (!VALID_CARE_ACTIONS.includes(action as CareAction)) {
    throw new ValidationError(
      `Invalid care action: ${action}. Must be one of: ${VALID_CARE_ACTIONS.join(', ')}`
    );
  }

  return action as CareAction;
}

/**
 * Validate familiar ID format
 * @param familiarId Familiar ID to validate
 * @returns Sanitized familiar ID
 * @throws ValidationError if invalid
 */
export function validateFamiliarId(familiarId: unknown): string {
  if (typeof familiarId !== 'string') {
    throw new ValidationError('Familiar ID must be a string');
  }

  // Remove any whitespace
  const sanitized = familiarId.trim();

  // Check length
  if (sanitized.length === 0) {
    throw new ValidationError('Familiar ID cannot be empty');
  }

  if (sanitized.length > 200) {
    throw new ValidationError('Familiar ID is too long');
  }

  // Check for valid characters (alphanumeric, underscore, colon, hyphen)
  if (!/^[a-zA-Z0-9_:\-]+$/.test(sanitized)) {
    throw new ValidationError('Familiar ID contains invalid characters');
  }

  return sanitized;
}

/**
 * Validate mutation option ID
 * @param optionId Option ID to validate
 * @returns Sanitized option ID
 * @throws ValidationError if invalid
 */
export function validateMutationOptionId(optionId: unknown): string {
  if (typeof optionId !== 'string') {
    throw new ValidationError('Mutation option ID must be a string');
  }

  // Remove any whitespace
  const sanitized = optionId.trim();

  // Check length
  if (sanitized.length === 0) {
    throw new ValidationError('Mutation option ID cannot be empty');
  }

  if (sanitized.length > 100) {
    throw new ValidationError('Mutation option ID is too long');
  }

  // Check for valid characters (alphanumeric, underscore, hyphen)
  if (!/^[a-z0-9_\-]+$/.test(sanitized)) {
    throw new ValidationError('Mutation option ID contains invalid characters');
  }

  return sanitized;
}

/**
 * Validate mutation session ID
 * @param sessionId Session ID to validate
 * @returns Sanitized session ID
 * @throws ValidationError if invalid
 */
export function validateSessionId(sessionId: unknown): string {
  if (typeof sessionId !== 'string') {
    throw new ValidationError('Session ID must be a string');
  }

  // Remove any whitespace
  const sanitized = sessionId.trim();

  // Check length
  if (sanitized.length === 0) {
    throw new ValidationError('Session ID cannot be empty');
  }

  if (sanitized.length > 200) {
    throw new ValidationError('Session ID is too long');
  }

  // Check for valid characters (alphanumeric, underscore, colon, hyphen)
  if (!/^[a-zA-Z0-9_:\-]+$/.test(sanitized)) {
    throw new ValidationError('Session ID contains invalid characters');
  }

  return sanitized;
}

/**
 * Validate creature ID format
 * @param creatureId Creature ID to validate
 * @returns Sanitized creature ID
 * @throws ValidationError if invalid
 */
export function validateCreatureId(creatureId: unknown): string {
  if (typeof creatureId !== 'string') {
    throw new ValidationError('Creature ID must be a string');
  }

  // Remove any whitespace
  const sanitized = creatureId.trim();

  // Check length
  if (sanitized.length === 0) {
    throw new ValidationError('Creature ID cannot be empty');
  }

  if (sanitized.length > 200) {
    throw new ValidationError('Creature ID is too long');
  }

  // Check for valid characters (alphanumeric, underscore, colon, hyphen)
  if (!/^[a-zA-Z0-9_:\-]+$/.test(sanitized)) {
    throw new ValidationError('Creature ID contains invalid characters');
  }

  return sanitized;
}

/**
 * Validate stat value (must be 0-100)
 * @param value Stat value to validate
 * @returns Validated stat value
 * @throws ValidationError if invalid
 */
export function validateStatValue(value: unknown): number {
  if (typeof value !== 'number') {
    throw new ValidationError('Stat value must be a number');
  }

  if (isNaN(value) || !isFinite(value)) {
    throw new ValidationError('Stat value must be a valid number');
  }

  if (value < 0 || value > 100) {
    throw new ValidationError('Stat value must be between 0 and 100');
  }

  return value;
}

/**
 * Validate care meter value (must be 0-100)
 * @param value Care meter value to validate
 * @returns Validated care meter value
 * @throws ValidationError if invalid
 */
export function validateCareMeter(value: unknown): number {
  if (typeof value !== 'number') {
    throw new ValidationError('Care meter value must be a number');
  }

  if (isNaN(value) || !isFinite(value)) {
    throw new ValidationError('Care meter value must be a valid number');
  }

  if (value < 0 || value > 100) {
    throw new ValidationError('Care meter value must be between 0 and 100');
  }

  return Math.floor(value);
}

/**
 * Validate evolution points value (must be non-negative)
 * @param value Evolution points to validate
 * @returns Validated evolution points
 * @throws ValidationError if invalid
 */
export function validateEvolutionPoints(value: unknown): number {
  if (typeof value !== 'number') {
    throw new ValidationError('Evolution points must be a number');
  }

  if (isNaN(value) || !isFinite(value)) {
    throw new ValidationError('Evolution points must be a valid number');
  }

  if (value < 0) {
    throw new ValidationError('Evolution points cannot be negative');
  }

  return Math.floor(value);
}

/**
 * Validate boolean value
 * @param value Value to validate
 * @returns Validated boolean
 * @throws ValidationError if invalid
 */
export function validateBoolean(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError('Value must be a boolean');
  }

  return value;
}

/**
 * Validate mutation category
 * @param category Category to validate
 * @returns Validated category
 * @throws ValidationError if invalid
 */
export function validateMutationCategory(category: unknown): string {
  if (typeof category !== 'string') {
    throw new ValidationError('Mutation category must be a string');
  }

  if (!VALID_MUTATION_CATEGORIES.includes(category as any)) {
    throw new ValidationError(
      `Invalid mutation category: ${category}. Must be one of: ${VALID_MUTATION_CATEGORIES.join(', ')}`
    );
  }

  return category;
}

/**
 * Validate biome type
 * @param biome Biome to validate
 * @returns Validated biome
 * @throws ValidationError if invalid
 */
export function validateBiome(biome: unknown): string {
  if (typeof biome !== 'string') {
    throw new ValidationError('Biome must be a string');
  }

  if (!VALID_BIOMES.includes(biome as any)) {
    throw new ValidationError(
      `Invalid biome: ${biome}. Must be one of: ${VALID_BIOMES.join(', ')}`
    );
  }

  return biome;
}

/**
 * Sanitize string input to prevent injection attacks
 * @param input String to sanitize
 * @param maxLength Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove any null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate username format
 * @param username Username to validate
 * @returns Sanitized username
 * @throws ValidationError if invalid
 */
export function validateUsername(username: unknown): string {
  if (typeof username !== 'string') {
    throw new ValidationError('Username must be a string');
  }

  // Remove any whitespace
  const sanitized = username.trim();

  // Check length
  if (sanitized.length === 0) {
    throw new ValidationError('Username cannot be empty');
  }

  if (sanitized.length > 100) {
    throw new ValidationError('Username is too long');
  }

  // Check for valid characters (alphanumeric, underscore, hyphen)
  if (!/^[a-zA-Z0-9_\-]+$/.test(sanitized)) {
    throw new ValidationError('Username contains invalid characters');
  }

  return sanitized;
}

/**
 * Validate randomness factor (must be 0-1)
 * @param value Randomness factor to validate
 * @returns Validated randomness factor
 * @throws ValidationError if invalid
 */
export function validateRandomnessFactor(value: unknown): number {
  if (typeof value !== 'number') {
    throw new ValidationError('Randomness factor must be a number');
  }

  if (isNaN(value) || !isFinite(value)) {
    throw new ValidationError('Randomness factor must be a valid number');
  }

  if (value < 0 || value > 1) {
    throw new ValidationError('Randomness factor must be between 0 and 1');
  }

  return value;
}
