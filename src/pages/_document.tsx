import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        {/* Suppress hydration warnings from browser extensions */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Monkey patch console.error to filter out hydration errors
                const originalConsoleError = console.error;
                console.error = function() {
                  if (
                    arguments[0] && 
                    typeof arguments[0] === 'string' && 
                    (arguments[0].includes('Hydration failed because') || 
                     arguments[0].includes('bis_skin_checked'))
                  ) {
                    return;
                  }
                  originalConsoleError.apply(console, arguments);
                };
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
