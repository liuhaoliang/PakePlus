// 依赖：eslint + eslint-config-next + @typescript-eslint + eslint-plugin-jsx-a11y
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "plugin:jsx-a11y/recommended"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "react/jsx-key": "error",
  },
};