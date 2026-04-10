export interface AIProvider {
  readonly name: string;
  complete(system: string, userPrompt: string): Promise<string>;
}
