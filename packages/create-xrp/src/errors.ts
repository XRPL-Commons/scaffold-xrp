export class CliError extends Error {
  constructor(message: string, public readonly exitCode: number = 1) {
    super(message);
    this.name = 'CliError';
  }
}
