export interface ScriptConfig {
    genre: string;
    audience: string;
    tone: string;
    duration: string;
}

export interface ScriptSegment {
    title: string;
    content: string;
    image_description: string;
}

export interface ScriptJSON {
    title: string;
    segments: ScriptSegment[];
}

export interface FullContent {
    content: string;
    title: string;
}

export interface GenerateScriptParams {
    content: string;
    title: string;
    config?: ScriptConfig;
}

export interface SplitScriptParams {
    promptId: string;
    script: string;
    full_content: FullContent;
}

export interface EditScriptParams {
    originalScript: string;
    editInstructions: string;
}

export interface ScriptGenerationResult {
    script: string;
}

export interface ScriptSplitResult {
    segments: string[];
    imageDescriptions: string[];
}

export interface ScriptGetResult {
    scriptList: string[];
    selectedLiterature: FullContent;
}