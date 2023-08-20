import dotenv from "dotenv";
dotenv.config();

function required(key: string, defaultValue?: string) {
  const value = process.env[key] || defaultValue;
  if (value == null) {
    throw new Error(`Key ${key} is undefined`);
  }
  return value;
}

export default {
  host: {
    cors: required("CORS_ORIGIN", "http://localhost:3000"),
    port: parseInt(required("HOST_PORT", "4000")),
  },
  key: {
    openai: required("OPENAI_API_KEY"),
  },
};
