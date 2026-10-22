import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  ...tseslint.configs.recommended,
  { files: ['src/**/*.{ts,tsx}'], ...jsxA11y.flatConfigs.recommended }
);
