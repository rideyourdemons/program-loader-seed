# Tool JSON Migration Guide

## Current Status

The validation system has been updated to enforce the new platform skeleton. Existing tool JSON files need to be migrated to the new format.

## New Required Schema

Every tool JSON file must include:

### Root Level:
- `pillar_slug` (string) - Must match a slug in `config/pillars.json`
- `domain_slug` (string) - Must match a slug in `config/domains.json`

### Per Tool:
- `tool_id` (string) - Unique identifier within the repo
- `state_id` (string) - Must be S1, S2, S3, or S4 (from `config/states.json`)
- `title` (string) - Tool name
- `slug` (string) - Kebab-case URL slug
- `description` (string) - Minimum 180 characters
- `steps` (array of strings) - 3-7 items, each minimum 20 characters, action-phrased
- `how_it_works` (string) - Minimum 400 characters
- `where_it_came_from` (string) - Minimum 120 characters
- `disclaimer` (string) - Must include: "This is here if you want it. Use what helps. Ignore what doesn't."

## Migration Steps

1. Use the generator to create properly formatted files:
   ```bash
   npm run gen:domain -- --pillar mens-mental-health --domain loss-and-grief
   ```

2. Or manually update existing files to match the new schema.

3. Run validation:
   ```bash
   npm run validate
   ```

## Validation Scripts

- `npm run validate:tool-mapping` - Validates skeleton structure
- `npm run validate:tools` - Validates content completeness
- `npm run validate:truth` - Validates truth integrity and RYD compliance
- `npm run validate` - Runs all three validations
