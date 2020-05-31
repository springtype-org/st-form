import {attr, component, event} from "springtype/web/component";
import {st} from "springtype/core";
import {IEventListener} from "springtype/web/component/interface";
import {stForm} from "../../st-form";

export interface IAttrValidation {
    debounceTimeInMs?: number;
    eventListeners?: Array<string>;
    validators?: Array<(value: any) => Promise<boolean>>;
    onValidation?: IEventListener<ValidationEventDetail>;
}

export interface IValidation {
    valid: boolean;
    validated: boolean;
    errors: Array<string>;
    value: boolean | string | number | Date | undefined | null;
}

export interface ValidationEventDetail extends IValidation {
}

@component
export class Validation extends st.component<IAttrValidation> {

    @attr
    eventListeners!: Array<string>;

    @attr
    debounceTimeInMs!: number;

    @attr
    validators: Array<(value: any) => Promise<boolean>> = [];

    @event
    onValidation!: IEventListener<ValidationEventDetail>;

    target!: HTMLTextAreaElement | HTMLInputElement;

    validationReject!: (reason?: any) => void;

    timeout!: any;

    state!: IValidation;

    constructor() {
        super();
    }

    dispatchValidation = (detail: ValidationEventDetail) => {
        this.dispatchEvent<ValidationEventDetail>("validation", {
            bubbles: true,
            cancelable: true,
            composed: true,
            detail: {
                ...detail,
            },
        });
    };

    render() {
        return this.renderChildren()
    }

    onConnect(): void {
        super.onConnect();
        for (const eventListener of this.eventListeners || stForm.validationEventListener) {
            this.el.addEventListener(eventListener, this.onTargetEvent(eventListener));
        }
    }

    onDisconnect(): void {
        super.onDisconnect();
        for (const eventListener of this.eventListeners || stForm.validationEventListener) {
            this.el.removeEventListener(eventListener, this.onTargetEvent(eventListener));
        }
    }

    onAfterRender(): void {
        const input = this.el.querySelector('input');
        if (input) {
            this.target = input as HTMLInputElement;
        } else {
            const textarea = this.el.querySelector('textarea');
            if (textarea) {
                this.target = textarea as HTMLTextAreaElement;
            }
        }
        if (!this.target) {
            st.error('Validator, missing textarea or input child')
        } else {
            (this.target as any)[stForm.validationPropertyName] = this;
        }
    }

    async validate(force: boolean = false): Promise<boolean> {
        if (this.validationReject) {
            this.validationReject({reason: 'validation', message: `rejected validation ${this.target.name}`});
            delete this.validationReject;
        }

        try {
            return await new Promise<boolean>((resolve, reject) => {
                    this.validationReject = reject;
                    clearTimeout(this.timeout);
                    this.timeout = setTimeout(async () => {
                            const value = this.getValue();
                            if (force || !this.state || this.state.value !== value) {
                                //set custom error
                                this.target.setCustomValidity(' ');

                                let valid = true;

                                if (this.target.type === 'radio') {
                                    //TODO: validate radio buttons
                                    /* const validationState = await this.doRadioValidation(_value);
                                     valid = validationState.valid;
                                     this.state = Object.freeze(validationState);*/
                                } else {
                                    const errors: Array<string> = [];
                                    for (const validator of this.validators) {
                                        if (!await validator(value)) {
                                            valid = false;
                                            errors.push((validator as any)[stForm.validatorName]);
                                        }
                                    }
                                    this.state = Object.freeze({validated: true, value: value, valid: valid, errors: errors});
                                    this.dispatchValidation(this.state);
                                }

                                this.target.setCustomValidity(valid ? '' : ' ');
                                resolve(valid);
                            } else {
                                resolve(this.state.valid);
                            }
                        },
                        this.debounceTimeInMs || stForm.validationDebounceTimeInMs
                    )
                }
            );
        } catch (e) {
            return false;
        }
    }

    /* async doRadioValidation(_value: string): Promise<IValidationState> {
         let valid = true;
         const errors: Array<string> = [];
         let parent = (this.el as HTMLInputElement).form;
         if (parent) {
             const elements = parent.elements;
             if (elements.namedItem(this.target.name) instanceof RadioNodeList) {
                 const radioList = elements.namedItem(this.target.name) as RadioNodeList;
                 for (const radioInput of nodeListToArray<any>(radioList)) {
                     if (radioInput.$stComponent) {
                         // const component = (radioInput as any).$stComponent;
                         const validators = radioInput.$stComponent.validators;
                         if (validators.length > 0) {
                             for (const validator of validators) {
                                 if (!await validator(_value)) {
                                     valid = false;
                                     errors.push((validator as any)['VALIDATOR_NAME']);
                                 }
                             }
                             break;
                         }
                     }
                 }
                 for (let i = 0; i < radioList.length; i++) {
                     const radioInput = radioList.item(i);
                     if (radioList && (radioInput as any).$stComponent) {
                         const component = (radioInput as any).$stComponent as Input;
                         component.validationState = ({valid, errors, _value});
                         component.updateValidation();
                     }
                 }
             }
         }
         return {validated: true, valid, errors, _value}
     }*/

    onTargetEvent = (eventListener: string) => (evt: Event) => {
        if (this.target === evt.target) {
            if (stForm.logDebugMessages) {
                st.debug('validation', eventListener, evt, evt.target);
            }
            //do validation
            this.validate();
        }

    };

    getValue(): string | number | boolean | Date | null | undefined {
        let value;
        if (this.target instanceof HTMLInputElement) {
            value = this.getInputValue(this.target);
        }
        if (this.target instanceof HTMLTextAreaElement) {
            value = this.getTextAreaValue(this.target);
        }
        return value;
    }

    getInputValue(input: HTMLInputElement): boolean | string | number | Date | null {
        const type = input.type;
        switch (type) {
            case 'number':
                return input.valueAsNumber;
            case 'date':
                return input.valueAsDate;
            case 'checkbox':
                return input.checked;
            case 'radio':
                const form = (this.el as HTMLInputElement).form;
                if (form &&
                    form.elements &&
                    form.elements.namedItem(this.target.name) &&
                    form.elements.namedItem(this.target.name) instanceof RadioNodeList) {
                    return (form.elements.namedItem(this.target.name) as RadioNodeList).value;
                }
        }
        return input.value || ''
    }

    getTextAreaValue(textArea: HTMLTextAreaElement): string {
        return textArea.value || '';
    }
}