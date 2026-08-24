/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 35;
export const USERNAME_PIN_LENGTH = 4;
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const LETTER_SET = new Set(LETTERS.split(''));
const ALLOWED_SET = new Set([...LETTERS.split(''), ...DIGITS.split(''), '_', '.']);
const RESERVED_SUFFIXES = ['.com', '.org', '.net', '.int', '.edu', '.gov', '.mil', '.arpa', '.html', '.htm', '.txt', '.xml'];
const RESERVED_WORDS = ['whatsapp', 'instagram', 'facebook', 'oculus'];
const PIN_PATTERN = /^[0-9]{4}$/;
export const UsernameValidationError = {
    INVALID_CHARACTER: 'INVALID_CHARACTER',
    INVALID_LENGTH: 'INVALID_LENGTH',
    INVALID_NO_LETTERS: 'INVALID_NO_LETTERS',
    INVALID_PERIODS: 'INVALID_PERIODS',
    INVALID_DOMAIN_SUFFIX: 'INVALID_DOMAIN_SUFFIX',
    INVALID_WWW_PREFIX: 'INVALID_WWW_PREFIX',
    INVALID_WORD: 'INVALID_WORD'
};
export const stripUsernamePrefix = (username) => {
    return typeof username === 'string' && username.startsWith('@') ? username.slice(1) : username;
};
export const displayUsername = (username) => {
    return '@' + stripUsernamePrefix(username);
};
export const validateUsername = (username) => {
    const value = stripUsernamePrefix(username);
    if (typeof value !== 'string') {
        return { isValid: false, errorType: UsernameValidationError.INVALID_CHARACTER };
    }
    const characters = Array.from(value);
    if (!characters.every(character => ALLOWED_SET.has(character))) {
        return { isValid: false, errorType: UsernameValidationError.INVALID_CHARACTER };
    }
    if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) {
        return { isValid: false, errorType: UsernameValidationError.INVALID_LENGTH };
    }
    if (!characters.some(character => LETTER_SET.has(character))) {
        return { isValid: false, errorType: UsernameValidationError.INVALID_NO_LETTERS };
    }
    if (value.startsWith('.') || value.endsWith('.') || value.includes('..')) {
        return { isValid: false, errorType: UsernameValidationError.INVALID_PERIODS };
    }
    const lowered = value.toLowerCase();
    if (lowered.startsWith('www.')) {
        return { isValid: false, errorType: UsernameValidationError.INVALID_WWW_PREFIX };
    }
    if (RESERVED_SUFFIXES.some(suffix => lowered.endsWith(suffix))) {
        return { isValid: false, errorType: UsernameValidationError.INVALID_DOMAIN_SUFFIX };
    }
    if (RESERVED_WORDS.some(word => lowered.includes(word))) {
        return { isValid: false, errorType: UsernameValidationError.INVALID_WORD };
    }
    return { isValid: true };
};
export const isUsernamePin = (pin) => {
    return typeof pin === 'string' && PIN_PATTERN.test(pin);
};
