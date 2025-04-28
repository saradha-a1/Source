"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonPlaceholderReplacer = void 0;
const defaultDelimiterTags = [
    {
        begin: "{{",
        end: "}}",
    },
    {
        begin: "<<",
        end: ">>",
    },
];
const defaultSeparator = ":";
const defaultNullishValues = [];
class JsonPlaceholderReplacer {
    constructor(options) {
        this.variablesMap = [];
        this.configuration = this.initializeOptions(options);
        const escapeRegExp = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        this.configuration.delimiterTags = this.configuration.delimiterTags.map((tag) => (Object.assign(Object.assign({}, tag), { escapedBeginning: escapeRegExp(tag.begin), escapedEnding: escapeRegExp(tag.end) })));
        const delimiterTagsRegexes = this.configuration.delimiterTags
            .map((delimiterTag) => `^${delimiterTag.begin}[^${delimiterTag.end}]+${delimiterTag.end}$`)
            .join("|");
        this.delimiterTagsRegex = new RegExp(delimiterTagsRegexes);
    }
    addVariableMap(variableMap) {
        if (typeof variableMap === "string") {
            this.variablesMap.push(JSON.parse(variableMap));
        }
        else {
            this.variablesMap.push(variableMap);
        }
        return this;
    }
    setVariableMap(...variablesMap) {
        this.variablesMap.length = 0;
        variablesMap.forEach((variableMap) => this.addVariableMap(variableMap));
        return this;
    }
    replace(json) {
        return this.replaceChildren(json, this.variablesMap);
    }
    replaceWith(json, ...variablesMap) {
        return this.replaceChildren(json, variablesMap);
    }
    initializeOptions(options) {
        var _a;
        let delimiterTags = defaultDelimiterTags;
        let defaultValueSeparator = defaultSeparator;
        let nullishValues = defaultNullishValues;
        if (options !== undefined) {
            if (options.delimiterTags !== undefined &&
                options.delimiterTags.length > 0) {
                delimiterTags = options.delimiterTags;
            }
            if (options.defaultValueSeparator !== undefined) {
                defaultValueSeparator = options.defaultValueSeparator;
            }
            if ((_a = options.nullishValues) === null || _a === void 0 ? void 0 : _a.length) {
                nullishValues = options.nullishValues.map((v) => JSON.stringify(v));
            }
        }
        return { defaultValueSeparator, delimiterTags, nullishValues };
    }
    replaceChildren(node, variablesMap) {
        for (const key in node) {
            const attribute = node[key];
            if (typeof attribute === "object") {
                node[key] = this.replaceChildren(attribute, variablesMap);
            }
            else if (attribute !== undefined) {
                node[key] = this.replaceValue(attribute, variablesMap);
            }
        }
        return node;
    }
    replaceValue(node, variablesMap) {
        const attributeAsString = node.toString();
        const placeHolderIsInsideStringContext = !this.delimiterTagsRegex.test(node);
        const output = this.configuration.delimiterTags.reduce((acc, delimiterTag) => {
            const regex = new RegExp(`(${delimiterTag.escapedBeginning}[^${delimiterTag.escapedEnding}]+${delimiterTag.escapedEnding})`, "g");
            return acc.replace(regex, this.replacer(placeHolderIsInsideStringContext, variablesMap)(delimiterTag));
        }, attributeAsString);
        try {
            if (output === attributeAsString) {
                return node;
            }
            return JSON.parse(output);
        }
        catch (exc) {
            return output;
        }
    }
    replacer(placeHolderIsInsideStringContext, variablesMap) {
        return (delimiterTag) => (placeHolder) => {
            const { tag, defaultValue } = this.parseTag(placeHolder, delimiterTag);
            const mapCheckResult = this.checkInEveryMap(tag, variablesMap);
            if (mapCheckResult === undefined) {
                if (defaultValue !== undefined) {
                    return defaultValue;
                }
                return placeHolder;
            }
            if (!placeHolderIsInsideStringContext) {
                return mapCheckResult;
            }
            const parsed = JSON.parse(mapCheckResult);
            if (typeof parsed === "object") {
                return JSON.stringify(parsed);
            }
            return parsed;
        };
    }
    parseTag(placeHolder, delimiterTag) {
        const path = placeHolder.substring(delimiterTag.begin.length, placeHolder.length - delimiterTag.begin.length);
        let tag = path;
        let defaultValue;
        const defaultValueSeparatorIndex = path.indexOf(this.configuration.defaultValueSeparator);
        if (defaultValueSeparatorIndex > 0) {
            tag = path.substring(0, defaultValueSeparatorIndex);
            defaultValue = path.substring(defaultValueSeparatorIndex +
                this.configuration.defaultValueSeparator.length);
        }
        return { tag, defaultValue };
    }
    checkInEveryMap(path, variablesMap) {
        const { nullishValues } = this.configuration;
        let result;
        variablesMap.forEach((map) => {
            let value = this.navigateThroughMap(map, path);
            if (value !== undefined && nullishValues.includes(value)) {
                value = undefined;
            }
            result = value || result;
        });
        return result;
    }
    navigateThroughMap(map, path) {
        if (map === undefined) {
            return;
        }
        const shortCircuit = map[path];
        if (shortCircuit !== undefined) {
            return JSON.stringify(shortCircuit);
        }
        const keys = path.split(".");
        const key = keys[0];
        keys.shift();
        return this.navigateThroughMap(map[key], keys.join("."));
    }
}
exports.JsonPlaceholderReplacer = JsonPlaceholderReplacer;
