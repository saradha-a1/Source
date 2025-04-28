export interface DelimiterTag {
    begin: string;
    end: string;
    escapedBeginning?: string;
    escapedEnding?: string;
}
export interface Configuration {
    delimiterTags: DelimiterTag[];
    defaultValueSeparator: string;
    nullishValues: (boolean | number | string | null)[];
}
type VariableMap = Record<string, unknown>;
export declare class JsonPlaceholderReplacer {
    private readonly variablesMap;
    private readonly configuration;
    private readonly delimiterTagsRegex;
    constructor(options?: Partial<Configuration>);
    addVariableMap(variableMap: VariableMap | string): JsonPlaceholderReplacer;
    setVariableMap(...variablesMap: (VariableMap | string)[]): JsonPlaceholderReplacer;
    replace(json: object): object;
    replaceWith(json: object, ...variablesMap: VariableMap[]): object;
    private initializeOptions;
    private replaceChildren;
    private replaceValue;
    private replacer;
    private parseTag;
    private checkInEveryMap;
    private navigateThroughMap;
}
export {};
