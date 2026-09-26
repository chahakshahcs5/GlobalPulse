import { Controller, Get, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { openApiSpec } from '../../docs/openapi';

@Controller('docs')
export class OpenApiController {
  @Get('openapi.json')
  getOpenApiSpec() {
    return openApiSpec;
  }

  @Get()
  getDocumentationPage(@Res({ passthrough: true }) reply: FastifyReply) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>GlobalPulse API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/docs/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout'
    });
  </script>
</body>
</html>
    `;
    reply.type('text/html');
    return html;
  }
}
