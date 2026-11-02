const http = require('http');
const fs = require('fs');
const path = require('path');

const openApiUrl = process.env.OPENAPI_URL || 'http://localhost:3001/api/docs-json';
const outputJson = path.resolve(__dirname, '../packages/api-contracts/openapi/openapi.json');
const outputYaml = path.resolve(__dirname, '../packages/api-contracts/openapi/openapi.yaml');

console.log(`Fetching OpenAPI schema from ${openApiUrl}...`);

http.get(openApiUrl, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to fetch schema: HTTP ${res.statusCode}`);
    process.exit(1);
  }

  let raw = '';
  res.on('data', (chunk) => {
    raw += chunk;
  });

  res.on('end', () => {
    try {
      const doc = JSON.parse(raw);
      fs.writeFileSync(outputJson, JSON.stringify(doc, null, 2), 'utf-8');
      console.log(`Saved JSON schema to ${outputJson} (${(raw.length / 1024).toFixed(1)} KB)`);

      // Try converting to YAML using js-yaml
      let yaml;
      try {
        yaml = require('js-yaml');
      } catch (_) {
        const pnpmYamlPath = path.resolve(__dirname, '../node_modules/.pnpm/js-yaml@4.1.0/node_modules/js-yaml');
        yaml = require(pnpmYamlPath);
      }

      const yamlContent = yaml.dump(doc, { indent: 2, lineWidth: -1 });
      fs.writeFileSync(outputYaml, yamlContent, 'utf-8');
      console.log(`Saved YAML schema to ${outputYaml} (${(yamlContent.length / 1024).toFixed(1)} KB)`);
      console.log('OpenAPI schema synchronization complete!');
    } catch (e) {
      console.error('Error processing OpenAPI response:', e);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error(`Network error connecting to ${openApiUrl}:`, err.message);
  process.exit(1);
});

