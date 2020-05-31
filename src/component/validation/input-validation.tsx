import {st} from "springtype/core";
import {ILifecycle} from "springtype/web/component/interface";
import {tsx} from "springtype/web/vdom";
import {attr, component} from "springtype/web/component";
import {ref} from "springtype/core/ref";
import {FORM_IGNORE_PROPERTY_NAME, IAttrValidation, Validation} from "..";
import {mergeArrays, TYPE_UNDEFINED} from "springtype/core/lang";
import {max, maxLength, min, minLength, pattern, required} from "st-validate";

export interface IAttrMatTextInput extends IAttrValidation {
    formIgnore?: boolean;
    placeholder?: string;
    readonly?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    required?: boolean;
    max?: number | Date;
    min?: number | Date;
}

@component
export class InputValidation extends st.component<IAttrMatTextInput> implements ILifecycle {

    @attr
    formIgnore = false;

    @attr
    readonly!: boolean;

    @attr
    maxLength!: number;

    @attr
    minLength!: number;

    @attr
    pattern!: RegExp;

    @attr
    required!: boolean;

    //for range
    @attr
    max!: number | Date;

    @attr
    min!: number | Date;


    //validation properties
    @attr
    eventListeners!: Array<string>;

    @attr
    debounceTimeInMs!: number;

    @attr
    validators: Array<(value: any) => Promise<boolean>> = [];

    @ref
    inputRef!: HTMLInputElement;

    @ref
    validationRef!: Validation;

    constructor() {
        super();
    }

    render() {
        const internalValidators = [];

        if (typeof this.required !== TYPE_UNDEFINED) {
            internalValidators.push(required)
        }
        if (typeof this.maxLength !== TYPE_UNDEFINED) {
            internalValidators.push(maxLength(this.maxLength))
        }
        if (typeof this.minLength !== TYPE_UNDEFINED) {
            internalValidators.push(minLength(this.minLength))
        }
        if (typeof this.max !== TYPE_UNDEFINED) {
            internalValidators.push(max(this.max))
        }
        if (typeof this.min !== TYPE_UNDEFINED) {
            internalValidators.push(min(this.min))
        }
        if (typeof this.pattern !== TYPE_UNDEFINED) {
            internalValidators.push(pattern(this.pattern))
        }


        return <Validation ref={{validationRef: this}} validators={mergeArrays(internalValidators, this.validators)}
                           eventListeners={this.eventListeners} debounceTimeInMs={this.debounceTimeInMs}>
            {this.renderChildren()}
        </Validation>
    }

    onAfterRender(): void {
        super.onAfterRender();
        const input = this.validationRef.el.querySelector('input');
        if (!input) {
            throw Error('<InputValidation> missing HTML <input> as child element')
        }
        this.inputRef = input;
        if (this.formIgnore) {
            (this.inputRef as any)[FORM_IGNORE_PROPERTY_NAME] = true;
        }
        if (this.readonly) {
            this.inputRef.setAttribute('readOnly', '')
        }
        if (this.disabled) {
            this.inputRef.setAttribute('disabled', '')
        }
    }

    async validate(force: boolean = false) {
        return await this.validationRef.validate(force);
    }
}