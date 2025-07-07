import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Desactivar reglas problemáticas durante desarrollo
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn", // warn en lugar de error
      "react-hooks/exhaustive-deps": "warn", // warn en lugar de error
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-const": "warn",
      "prefer-const": "warn",
      
      // Permitir console.log en desarrollo
      "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
      
      // Relajar otras reglas comunes
      "no-debugger": process.env.NODE_ENV === "production" ? "error" : "warn",
      "no-alert": "warn",
      "no-unused-expressions": "off",
    },
  },
];

export default eslintConfig;