declare module 'inquirer' {
  interface Question {
    type: string;
    name: string;
    message: string;
    default?: unknown;
    choices?: Array<{ name: string; value: string } | string>;
    validate?: (input: string) => boolean | string;
  }

  interface Inquirer {
    prompt<T = Record<string, unknown>>(questions: Question[]): Promise<T>;
  }

  const inquirer: Inquirer;
  export default inquirer;
}
