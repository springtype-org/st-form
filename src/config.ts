import {globalThis} from "springtype/core";

export const WINDOW_GLOBAL_FORM_CONFIG_KEY = '$stForm';

export const DEFAULT_ST_FORM_LOG_DEBUG_MESSAGE_KEY = 'ST_FORM_LOG_DEBUG_MESSAGE'
export const DEFAULT_ST_FORM_VALIDATION_PROPERTY_NAME_KEY = 'ST_FORM_VALIDATION_PROPERTY_NAME'
export const DEFAULT_ST_FORM_VALIDATION_DEBOUNCE_TIME_IN_MS_KEY = 'ST_FORM_VALIDATION_DEBOUNCE_TIME_IN_MS'
export const DEFAULT_ST_FORM_VALIDATION_EVENT_LISTENER_KEY = 'ST_FORM_VALIDATION_EVENT_LISTENER'

export interface FormConfig {
    validationDebounceTimeInMs: number;
    validationEventListener: Array<string>;
    validationPropertyName: string;
    logDebugMessages: boolean;
}

const getValidationEventListenerFromEnv =() => {
    const env = process.env[DEFAULT_ST_FORM_VALIDATION_EVENT_LISTENER_KEY];
    if(env){
        return env.split('|');
    }
}

const getLogDebugFromEnv = () => {
        return process.env[DEFAULT_ST_FORM_LOG_DEBUG_MESSAGE_KEY] === 'true';
}

const getValidationDebunceTimeInMsFromEnv = () => {
    const env = process.env[DEFAULT_ST_FORM_VALIDATION_DEBOUNCE_TIME_IN_MS_KEY];
    if(env){
        return parseInt(env);
    }
}
export const defaultFormConfig: () => FormConfig = () => {
    return {
        logDebugMessages: getLogDebugFromEnv() || false,
        validationPropertyName: process.env[DEFAULT_ST_FORM_VALIDATION_PROPERTY_NAME_KEY] || 'VALIDATION',
        validationDebounceTimeInMs: getValidationDebunceTimeInMsFromEnv() || 250,
        validationEventListener: getValidationEventListenerFromEnv() || ['change', 'keyup']
    }
};

globalThis[WINDOW_GLOBAL_FORM_CONFIG_KEY] = defaultFormConfig();

export const getFormConfig = (): FormConfig => {
    return globalThis[WINDOW_GLOBAL_FORM_CONFIG_KEY]
};




