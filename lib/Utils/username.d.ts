export declare const USERNAME_MIN_LENGTH = 3;
export declare const USERNAME_MAX_LENGTH = 35;
export declare const USERNAME_PIN_LENGTH = 4;
export type UsernameValidationErrorType = 'INVALID_CHARACTER' | 'INVALID_LENGTH' | 'INVALID_NO_LETTERS' | 'INVALID_PERIODS' | 'INVALID_DOMAIN_SUFFIX' | 'INVALID_WWW_PREFIX' | 'INVALID_WORD';
export declare const UsernameValidationError: Record<UsernameValidationErrorType, UsernameValidationErrorType>;
export declare const stripUsernamePrefix: (username: string) => string;
export declare const displayUsername: (username: string) => string;
export declare const validateUsername: (username: string) => {
    isValid: boolean;
    errorType?: UsernameValidationErrorType;
};
export declare const isUsernamePin: (pin: string) => boolean;
