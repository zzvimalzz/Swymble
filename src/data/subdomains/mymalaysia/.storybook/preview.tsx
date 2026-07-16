import React from "react";
import type { Decorator, Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";

/**
 * Theme toolbar: renders stories inside the real `.dark`/light context so
 * every component is reviewed in both themes.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? "light";
  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="bg-background p-6 text-foreground">
        <Story />
      </div>
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [withTheme],
};

export default preview;
