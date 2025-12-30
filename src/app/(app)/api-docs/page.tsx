import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation - FixIt CMMS",
  description: "OpenAPI documentation for the FixIt CMMS REST API",
};

/**
 * API Documentation Page
 *
 * Embeds the OpenAPI/Swagger documentation for the FixIt API.
 * Uses Swagger UI via CDN for a lightweight integration.
 *
 * Access: /api-docs
 * Note: This page is only accessible in development mode
 */
export default function ApiDocsPage() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
          <p className="text-zinc-400">
            API documentation is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css"
        />
      </head>
      <body className="m-0 p-0">
        <div id="swagger-ui" />
        <script
          src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"
          crossOrigin="anonymous"
        />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for Swagger UI initialization script
          dangerouslySetInnerHTML={{
            __html: `
              window.onload = function() {
                window.ui = SwaggerUIBundle({
                  url: "/docs/openapi.yaml",
                  dom_id: '#swagger-ui',
                  deepLinking: true,
                  presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                  ],
                  layout: "BaseLayout",
                  tryItOutEnabled: true,
                  supportedSubmitMethods: ['get', 'post', 'put', 'patch', 'delete'],
                  validatorUrl: null
                });
              };
            `,
          }}
        />
      </body>
    </html>
  );
}
