declare module 'gtts' {
  class Gtts {
    constructor(text: string, language: string);
    save(outputPath: string, callback: (err: Error | null) => void): void;
  }
  export = Gtts;
} 