import {attr, component, event} from "springtype/web/component";
import {st} from "springtype/core";
import {tsx} from "springtype/web/vdom";
import {IEventListener, ILifecycle} from "springtype/web/component/interface";
import {ref} from "springtype/core/ref";
import {htmlCollectionToArray, TYPE_FUNCTION} from "springtype/core/lang";
import {Validation} from "..";
import {getFormConfig} from "../../config";

export interface FromValidationDetail {
    valid: boolean,
    state: any
}

export interface IAttrForm {
    name?: string;
}

export const FORM_PROPERTY_NAME = "FROM";
export const FORM_IGNORE_PROPERTY_NAME = "FORM_IGNORE";
export const FORM_VALUE_FUNCTION_KEY = "FORM_VALUE_FUNCTION";

@component
export class Form extends st.component<IAttrForm> {

    tag = "st-form";

    @attr
    name: string = "form";

    @ref
    formRef!: HTMLFormElement;

    @event
    onFormValidation!: IEventListener<Event>;

    validationReject!: (reason?: any) => void;

    dispatchFormValidation = (detail: FromValidationDetail) => {
        this.dispatchEvent<FromValidationDetail>("formValidation", {
            bubbles: true,
            cancelable: true,
            composed: true,
            detail: {
                ...detail,
            },
        });
    };


    render() {
        return <form ref={{formRef: this}}>
                {this.renderChildren()}
            </form>

    }

    onAfterRender(): void {
        this.addFormToForm();
        this.overrideSubmit();
    }

    addFormToForm() {
        (this.formRef as any)[FORM_PROPERTY_NAME] = this;
    }

    overrideSubmit() {
        //ignore on submit validate forms async
        this.formRef.addEventListener('submit', (evt) => {
            evt.preventDefault();

        })
    }

    async validate(force: boolean = false): Promise<boolean> {
        return await new Promise(async (resolve) => {
            let result = true;
            const elementPromises = await Promise.all(this.getElements().map(element => element.validate(force)));
            if (elementPromises.filter(v => !v).length > 0) {
                this.formRef.checkValidity();
                result = false;
            }
            const subFormPromises = await Promise.all(this.getSubForm().map(element => element.validate(force)));
            if (subFormPromises.filter(v => !v).length > 0) {
                result = false;
            }
            const validateResult: FromValidationDetail = {
                valid: result,
                state: this.getState()
            };
            this.dispatchFormValidation(validateResult);
            resolve(result);
        });
    }

    getElements(): Array<Validation> {
        //get validator name form configuration
        const validatorPropertyName = getFormConfig().validationPropertyName;

        const validationComponents: Array<Validation> = [];
        for (const element of htmlCollectionToArray<any>((this.formRef.elements))) {
            if (element[validatorPropertyName] && element[validatorPropertyName] instanceof Validation) {
                const validationComponent = element[validatorPropertyName] as Validation;
                if (!element.disabled && !element.readonly) {
                    validationComponents.push(validationComponent);
                }
            }
        }
        return validationComponents;
    }

    getState(): any {
        const formState: { [key: string]: any } = {};
        const radios: { [name: string]: RadioNodeList } = {};
        const elements = this.formRef.elements;
        for (const element of htmlCollectionToArray<HTMLElement>(elements)) {
            const anyElement = element as any;
            if (
                element instanceof HTMLButtonElement
                || anyElement[FORM_IGNORE_PROPERTY_NAME]) {
                continue
            }
            if (anyElement[FORM_VALUE_FUNCTION_KEY] && typeof anyElement[FORM_VALUE_FUNCTION_KEY] === TYPE_FUNCTION) {
                formState[anyElement.name] = anyElement[FORM_VALUE_FUNCTION_KEY]();
                continue;
            }

            if (element instanceof HTMLInputElement) {
                const htmlInput = element as HTMLInputElement;
                if (htmlInput.type === 'radio' && htmlInput.name) {
                    radios[htmlInput.name] = elements.namedItem(htmlInput.name) as RadioNodeList;
                    continue;
                }
                if (htmlInput.type === 'checkbox' && htmlInput.name) {
                    formState[htmlInput.name] = htmlInput.checked;
                    continue;
                }
            }
            const htmlElement = (element as any);
            const elementName = htmlElement.name;
            formState[elementName] = htmlElement.value;
        }
        for (const radioGroupName of Object.keys(radios)) {
            formState[radioGroupName] = radios[radioGroupName].value;
        }
        for (const form of this.getSubForm()) {
            formState[form.name] = form.getState();
        }
        return formState;
    }

    getSubForm(): Array<Form> {
        const forms: Array<Form> = [];
        for (const form of htmlCollectionToArray<any>(this.formRef.querySelectorAll('form'))) {
            if (form[FORM_PROPERTY_NAME] && form[FORM_PROPERTY_NAME] instanceof Form) {
                const nestedForm = form[FORM_PROPERTY_NAME] as Form;
                if (!!nestedForm && nestedForm === this) {
                    //do nothing its me
                    continue;
                }
                let parent: ILifecycle | undefined = nestedForm.parent;
                while (!!parent) {
                    if (!!parent && parent instanceof Form && parent === this) {
                        forms.push(nestedForm);
                    }
                    parent = parent.parent;
                }
            } else {
                st.error('Using an nested form, please use <Form name="formName">', form);
            }
        }
        return forms;
    }

    reset() {
        this.formRef.reset();
    }
}