import {I$FormConfig} from "./interface/i-$-form-config";


export const DEFAULT_ST_FORM_LOG_DEBUG_MESSAGE_KEY = 'ST_FORM_LOG_DEBUG_MESSAGE'
export const DEFAULT_ST_FORM_VALIDATION_PROPERTY_NAME_KEY = 'ST_FORM_VALIDATION_PROPERTY_NAME'
export const DEFAULT_ST_FORM_VALIDATION_DEBOUNCE_TIME_IN_MS_KEY = 'ST_FORM_VALIDATION_DEBOUNCE_TIME_IN_MS'
export const DEFAULT_ST_FORM_VALIDATION_EVENT_LISTENER_KEY = 'ST_FORM_VALIDATION_EVENT_LISTENER'

const getValidationEventListenerFromEnv = () => {
    const env = process.env[DEFAULT_ST_FORM_VALIDATION_EVENT_LISTENER_KEY];
    if (env) {
        return env.split('|');
    }
}

const getLogDebugFromEnv = () => {
    return process.env[DEFAULT_ST_FORM_LOG_DEBUG_MESSAGE_KEY] === 'true';
}

const getValidationDebounceTimeInMsFromEnv = () => {
    const env = process.env[DEFAULT_ST_FORM_VALIDATION_DEBOUNCE_TIME_IN_MS_KEY];
    if (env) {
        return parseInt(env);
    }
}

const FORM_KEY = "$stForm";

// scoped local global storage reference
const _globalThis: any = new Function("return this")();

// makes sure the global storage is not re-initialized
// and overwritten on subsequent calls / file imports
if (!_globalThis[FORM_KEY]) {

    // register scoped global as an instance of this class
    _globalThis[FORM_KEY] = {};
}

export const globalThis: any = _globalThis;
export const stForm: I$FormConfig = _globalThis[FORM_KEY];


if (!stForm.globalThis) {
    stForm.globalThis = globalThis;
}
if (!stForm.logDebugMessages) {
    stForm.logDebugMessages = getLogDebugFromEnv() || false;
}
if (!stForm.validatorName) {
    stForm.validatorName = 'VALIDATOR_NAME';
}
if (!stForm.validationPropertyName) {
    stForm.validationPropertyName = process.env[DEFAULT_ST_FORM_VALIDATION_PROPERTY_NAME_KEY] || 'VALIDATION';
}
if (!stForm.validationDebounceTimeInMs) {
    stForm.validationDebounceTimeInMs = getValidationDebounceTimeInMsFromEnv() || 250;
}
if (!stForm.validationEventListener) {
    stForm.validationEventListener = getValidationEventListenerFromEnv() || ['change', 'keyup'];
}
