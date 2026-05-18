import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAIKeyMissingError();
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

export class OpenAIKeyMissingError extends Error {
  constructor() {
    super(
      "OPENAI_API_KEY não configurada. Adicione a chave no arquivo .env para usar a geração com IA."
    );
    this.name = "OpenAIKeyMissingError";
  }
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}
