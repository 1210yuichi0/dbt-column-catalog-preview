# Change Log

All notable changes to the "dbt-column-catalog-preview" extension will be documented in this file.

## [0.1.0] - 2026-03-09

### Added
- Initial release
- Preview dbt YAML schema files as interactive column catalogs
- Search functionality across models, columns, types, and tests
- CSV export feature
- Collapsible descriptions with "more/less" toggle
- PII column highlighting
- Markdown support in descriptions
- Custom blue table icon
- Auto-update on YAML file changes
- Exclude dbt config files (dbt_project.yml, profiles.yml, etc.)

### Features
- Model grouping with descriptions
- Sortable table columns
- Compact table padding
- Test badge display
- Row numbering
- Statistics display (models, columns, tested, PII count)

### Technical
- TypeScript-based implementation
- Refactored code with constants management
- Type-safe implementation (removed `any` types)
- Unified error handling
