/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

export class CXXForwardsDeclarator {
    private readonly OPEN_ANGLE_BRACKET = "<";
    private readonly CLOSE_ANGLE_BRACKET = ">";
    private readonly OPEN_CURLY_BRACKET = "{";
    private readonly CLOSE_CURLY_BRACKET = "}";
    private readonly OPEN_BRACKET = "(";
    private readonly CLOSE_BRACKET = ")";

    private readonly NAMESPACE = "namespace";

    private readonly DOUBLECOLON = "::";
    private readonly COMMA = ",";

    private readonly TEMPLATE_PATTERN = "template";
    private readonly TEMPLATE_CLASS_PATTERN = "template class";

    private generatedContent: string[] = [];

    constructor(generatedContent: string[]) {
        this.generatedContent = generatedContent;
    }

    createForwardDeclarations() {
        const lines: string[] = [];

        const requiredForwardDeclarations = this.getClassesRequiredForwardDeclarations();

        for (const qualifiedClassName of requiredForwardDeclarations) {
            // Do not forward declare template classes (causes duplicates of std classes like Array).
            // Template instantiation of custom classes should be done on client's side.
            if (this.isTemplateClass(qualifiedClassName)) {
                continue;
            }

            lines.push(this.createForwardDeclaration(qualifiedClassName));
        }

        return lines;
    }

    private getTemplateInstances() {
        return this.generatedContent.filter((value) => value.startsWith(this.TEMPLATE_PATTERN));
    }

    private isClassTemplateInstance(line: string) {

        return line.startsWith(this.TEMPLATE_CLASS_PATTERN);
    }

    private isTemplateClass(qualifiedClassName: string) {
        return qualifiedClassName.includes(this.OPEN_ANGLE_BRACKET);
    }

    private removePointers(line: string) {
        return line.replace(/\*/g, "");
    }

    private getClassesRequiredForwardDeclarations() {
        const requiredForwardDeclarations = new Set<string>();

        const templateInstances = this.getTemplateInstances();

        for (const instance of templateInstances) {
            const templateArgs = this.getLastTemplateArguments(instance);

            for (const arg of templateArgs) {
                requiredForwardDeclarations.add(this.removePointers(arg));
            }

            if (!this.isClassTemplateInstance(instance)) {
                const args = this.getArguments(instance);
                for (const arg of args) {
                    requiredForwardDeclarations.add(this.removePointers(arg));
                }
            }
        }

        return requiredForwardDeclarations;
    }

    private getArguments(functionSignature: string) {
        const openBracketPos = functionSignature.indexOf(this.OPEN_BRACKET);
        const closeBracketPos = functionSignature.indexOf(this.CLOSE_BRACKET);

        const templateArgumentsString = functionSignature.substring(openBracketPos + 1, closeBracketPos);

        return this.splitParameterTypesByComma(templateArgumentsString.replace(" ", ""));
    }

    private splitParameterTypesByComma(parameterTypes: string) {
        const stack: number[] = [];

        const parts: string[] = [];
        let part = "";

        const isInTemplate = () => stack.length > 0;

        for (const char of parameterTypes) {
            if (char === this.OPEN_ANGLE_BRACKET) {
                stack.push(0);
            } else if (char === this.CLOSE_ANGLE_BRACKET) {
                stack.pop();
            }

            if (char === this.COMMA && !isInTemplate()) {
                parts.push(part);
                part = "";
                continue;
            }

            part += char;
        }

        parts.push(part);

        return parts;
    }

    private getLastTemplateArguments(template: string) {
        const lastOpenBracketPos = template.lastIndexOf(this.OPEN_ANGLE_BRACKET);
        const counterpartPos = template.indexOf(this.CLOSE_ANGLE_BRACKET, lastOpenBracketPos);

        const templateArgumentsString = template.substring(lastOpenBracketPos + 1, counterpartPos);
        if (!templateArgumentsString) {
            return [];
        }

        return this.splitParameterTypesByComma(templateArgumentsString.replace(" ", ""));
    }

    private createForwardDeclaration(qualifiedClassName: string) {
        if (this.isClassInNamespace(qualifiedClassName)) {
            return this.createForwardDeclarationInNamespace(qualifiedClassName);
        }

        return `class ${qualifiedClassName};`;
    }

    private createForwardDeclarationInNamespace(qualifiedClassName: string) {
        let line = "";

        const parts = qualifiedClassName.split(this.DOUBLECOLON);

        const className = parts.pop();
        if (!className) {
            throw new Error(`${qualifiedClassName} cannot be parsed as namespace::className`);
        }

        for (let i = 0; i < parts.length; ++i) {
            const namespacePart = parts[i];
            line += `${this.NAMESPACE} ${namespacePart} ${this.OPEN_CURLY_BRACKET}`;
        }

        line += this.createForwardDeclaration(className);

        for (let i = 0; i < parts.length; ++i) {
            line += this.CLOSE_CURLY_BRACKET;
        }

        return line;
    }

    private isClassInNamespace(qualifiedClassName: string) {
        return qualifiedClassName.includes(this.DOUBLECOLON);
    }
}
