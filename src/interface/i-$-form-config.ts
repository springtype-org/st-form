export interface I$FormConfig {
    // --- platform global reference
    // node: global, browser: window
    globalThis: any;

    validationDebounceTimeInMs: number;
    validationEventListener: Array<string>;
    validationPropertyName: string;
    validatorName: string;
    logDebugMessages: boolean;
}

