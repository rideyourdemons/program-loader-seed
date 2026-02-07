/**
 * Anchor Schema Definition
 * Separate schema for anchor/domain/pillar files (not tools)
 */

const path = require('path');

const ANCHOR_REQUIRED_FIELDS = [
  { key: 'id', name: 'id' },
  { key: 'name', alt: 'title', name: 'name/title' },
  { key: 'domain_slug', name: 'domain_slug' },
  { key: 'where_it_came_from', name: 'where_it_came_from' },
  { key: 'anchor_type', name: 'anchor_type' }
];

const ANCHOR_OPTIONAL_FIELDS = [
  'pillar_slug',
  'description',
  'summary',
  'keywords',
  'updated_at',
  'version',
  'slug',
  'disclaimer',
  'tools',
  'createdAt',
  'updatedAt',
  'top_searched_mechanic'
];

/**
 * Check if an object is an anchor (not a tool)
 */
function isAnchor(obj, filePath) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  // Primary detection: anchor_type field (most reliable)
  if (obj.anchor_type) {
    return true;
  }
  
  // Secondary detection: file path contains 'anchors' directory
  if (filePath && typeof filePath === 'string') {
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (normalizedPath.includes('/anchors/') || normalizedPath.includes('\\anchors\\')) {
      // If in anchors directory, it's an anchor
      return true;
    }
  }
  
  // Tertiary detection: has domain_slug but NO pillar/pillar_slug AND has tools array
  // Tool files have pillar/pillar_slug at root, anchors don't
  if (obj.domain_slug && !obj.pillar && !obj.pillar_slug) {
    // If it has tool-specific fields at root level, it's likely a tool
    const toolFields = ['state_id', 'how_it_works', 'steps', 'tool_id'];
    const hasToolFields = toolFields.some(field => obj[field] !== undefined);
    
    // If it has a tools array and no pillar, it's likely an anchor
    const hasToolsArray = Array.isArray(obj.tools);
    
    // If it has domain_slug but no pillar and no tool fields, and has tools array, it's an anchor
    return !hasToolFields && hasToolsArray;
  }
  
  return false;
}

/**
 * Validate anchor object against anchor schema
 */
function validateAnchor(anchor, filePath) {
  const errors = [];
  const relativePath = filePath ? path.relative(process.cwd(), filePath) : 'unknown';
  
  if (!anchor || typeof anchor !== 'object') {
    errors.push(`${relativePath}: Anchor must be an object`);
    return errors;
  }
  
  // Validate required fields
  for (const field of ANCHOR_REQUIRED_FIELDS) {
    const value = anchor[field.key] || (field.alt ? anchor[field.alt] : null);
    if (!value) {
      errors.push(`${relativePath}: Missing required field '${field.name}'`);
    } else if (typeof value === 'string' && value.trim() === '') {
      errors.push(`${relativePath}: Field '${field.name}' cannot be empty`);
    }
  }
  
  // Validate anchor_type enum
  if (anchor.anchor_type) {
    const validTypes = ['domain', 'pillar', 'anchor'];
    if (!validTypes.includes(anchor.anchor_type)) {
      errors.push(`${relativePath}: 'anchor_type' must be one of: ${validTypes.join(', ')}`);
    }
  }
  
  // Validate domain_slug exists in config
  if (anchor.domain_slug && typeof anchor.domain_slug === 'string') {
    // This will be validated by the caller with domainSlugs set
  }
  
  // Validate where_it_came_from is an object
  if (anchor.where_it_came_from) {
    if (typeof anchor.where_it_came_from !== 'object' || Array.isArray(anchor.where_it_came_from)) {
      errors.push(`${relativePath}: 'where_it_came_from' must be an object`);
    }
  }
  
  return errors;
}

module.exports = {
  ANCHOR_REQUIRED_FIELDS,
  ANCHOR_OPTIONAL_FIELDS,
  isAnchor,
  validateAnchor
};

// Export isAnchor for use in validate-tool-mapping
if (require.main === module) {
  // Test mode
  console.log('Anchor schema module loaded');
}
