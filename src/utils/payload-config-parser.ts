import { Project, SyntaxKind, Node, SourceFile, ObjectLiteralExpression, PropertyAssignment, StringLiteral, NumericLiteral, BooleanLiteral } from 'ts-morph';
import { CollectionInfo, FieldInfo, RelationshipInfo } from '../types/payload';

/**
 * Parse Payload CMS config and extract collection information
 * @param configPath Absolute path to payload.config.ts
 * @returns Array of CollectionInfo with fields and relationships
 */
export async function parsePayloadConfig(configPath: string): Promise<CollectionInfo[]> {
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  // Add the config file to the project
  const configSourceFile = project.addSourceFileAtPath(configPath);
  if (!configSourceFile) {
    throw new Error(`Could not load config file at: ${configPath}`);
  }

  // Get the directory of the config file for resolving relative paths
  const configDir = configSourceFile.getDirectoryPath();

  // Build import-to-path mapping from the config file
  const importMap = buildImportMap(configSourceFile);

  // Find the buildConfig call and get the collections array
  const collections = findCollectionsInConfig(configSourceFile);

  const collectionInfos: CollectionInfo[] = [];

  for (const collection of collections) {
    const collectionInfo = await parseCollectionFile(
      collection,
      importMap,
      configDir,
      project
    );
    if (collectionInfo) {
      collectionInfos.push(collectionInfo);
    }
  }

  return collectionInfos;
}

/**
 * Build a mapping from imported identifier names to their file paths
 */
function buildImportMap(sourceFile: SourceFile): Map<string, string> {
  const importMap = new Map<string, string>();

  const importDeclarations = sourceFile.getImportDeclarations();

  for (const importDecl of importDeclarations) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    const namedImports = importDecl.getNamedImports();
    const defaultImport = importDecl.getDefaultImport();

    // Handle default import (e.g., import Admins from './collections/Admins')
    if (defaultImport) {
      const name = defaultImport.getText();
      importMap.set(name, moduleSpecifier);
    }

    // Handle named imports (e.g., import { Admins } from './collections/Admins')
    for (const namedImport of namedImports) {
      const name = namedImport.getName();
      const alias = namedImport.getAliasNode()?.getText() || name;
      importMap.set(alias, moduleSpecifier);
    }
  }

  return importMap;
}

/**
 * Find all collection identifiers in the buildConfig call
 */
function findCollectionsInConfig(sourceFile: SourceFile): string[] {
  const collections: string[] = [];

  // Find buildConfig call
  const buildConfigCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => {
      const expression = call.getExpression();
      if (Node.isIdentifier(expression)) {
        return expression.getText() === 'buildConfig';
      }
      return false;
    });

  for (const call of buildConfigCalls) {
    const args = call.getArguments();
    if (args.length > 0) {
      const configArg = args[0];
      if (Node.isObjectLiteralExpression(configArg)) {
        // Find the collections property
        const collectionsProp = configArg.getProperty('collections');
        if (collectionsProp && Node.isPropertyAssignment(collectionsProp)) {
          const collectionsValue = collectionsProp.getInitializer();
          if (Node.isArrayLiteralExpression(collectionsValue)) {
            // Extract identifiers from the array
            for (const element of collectionsValue.getElements()) {
              if (Node.isIdentifier(element)) {
                collections.push(element.getText());
              } else if (Node.isPropertyAccessExpression(element)) {
                // Handle cases like Admins.Collection
                collections.push(element.getExpression().getText());
              }
            }
          }
        }
      }
    }
  }

  return collections;
}

/**
 * Resolve import path to actual file path
 * Handles @/ aliases and relative paths
 */
function resolveImportPath(importPath: string, configDir: string): string {
  // Handle @/ alias - resolve to {configDir}/../src/
  if (importPath.startsWith('@/')) {
    const relativePath = importPath.slice(2); // Remove @/
    return `${configDir}/../src/${relativePath}`;
  }

  // Handle relative paths
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return `${configDir}/${importPath}`;
  }

  // Handle node_modules imports - return as-is for now
  return importPath;
}

/**
 * Parse a single collection file and extract its information
 */
async function parseCollectionFile(
  collectionName: string,
  importMap: Map<string, string>,
  configDir: string,
  project: Project
): Promise<CollectionInfo | null> {
  // Get the import path for this collection
  const importPath = importMap.get(collectionName);
  if (!importPath) {
    console.warn(`Could not find import path for collection: ${collectionName}`);
    return null;
  }

  // Resolve to actual file path
  let resolvedPath = resolveImportPath(importPath, configDir);

  // Try different extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  let collectionSourceFile: SourceFile | undefined;

  for (const ext of extensions) {
    const pathWithExt = resolvedPath.endsWith(ext) ? resolvedPath : resolvedPath + ext;
    try {
      collectionSourceFile = project.addSourceFileAtPath(pathWithExt);
      if (collectionSourceFile) {
        resolvedPath = pathWithExt;
        break;
      }
    } catch {
      // Try next extension
    }
  }

  if (!collectionSourceFile) {
    console.warn(`Could not load collection file for: ${collectionName}`);
    return null;
  }

  // Find the CollectionConfig object
  const collectionConfig = findCollectionConfig(collectionSourceFile, collectionName);
  if (!collectionConfig) {
    console.warn(`Could not find CollectionConfig for: ${collectionName}`);
    return null;
  }

  // Extract collection info
  const slug = getPropertyValue<string>(collectionConfig, 'slug', 'string');
  const label = getPropertyValue<string | undefined>(collectionConfig, 'label', 'optionalString');
  const fields = extractFields(collectionConfig);

  // Build relationships from fields
  const relationships = buildRelationships(fields, slug);

  return {
    name: collectionName,
    slug,
    label,
    fields,
    relationships,
  };
}

/**
 * Find the CollectionConfig object by name
 */
function findCollectionConfig(sourceFile: SourceFile, collectionName: string): ObjectLiteralExpression | null {
  // Look for variable declarations with the collection name
  const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);

  for (const varDecl of variableDeclarations) {
    const name = varDecl.getName();
    if (name === collectionName) {
      const initializer = varDecl.getInitializer();
      if (initializer && Node.isObjectLiteralExpression(initializer)) {
        return initializer;
      }
    }
  }

  // Also check for direct object literals that might be the collection config
  const objectLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression);

  for (const obj of objectLiterals) {
    const slugProp = obj.getProperty('slug');
    if (slugProp && Node.isPropertyAssignment(slugProp)) {
      const slugValue = slugProp.getInitializer();
      if (Node.isStringLiteral(slugValue) && slugValue.getText() === `"${collectionName}"`) {
        return obj;
      }
    }
  }

  return null;
}

/**
 * Get a property value from an object literal
 */
function getPropertyValue<T>(
  obj: ObjectLiteralExpression,
  propName: string,
  expectedType: 'string' | 'number' | 'boolean' | 'optionalString'
): T {
  const prop = obj.getProperty(propName);
  if (!prop || !Node.isPropertyAssignment(prop)) {
    return '' as T;
  }

  const value = prop.getInitializer();
  if (!value) {
    return '' as T;
  }

  switch (expectedType) {
    case 'string':
      if (Node.isStringLiteral(value)) {
        return value.getText().replace(/"/g, '') as T;
      }
      break;
    case 'optionalString':
      if (Node.isStringLiteral(value)) {
        return value.getText().replace(/"/g, '') as T;
      }
      break;
    case 'number':
      if (Node.isNumericLiteral(value)) {
        return parseFloat(value.getText()) as T;
      }
      break;
    case 'boolean':
      if (Node.isIdentifier(value)) {
        // Handle true/false identifiers
        const text = value.getText();
        if (text === 'true' || text === 'false') {
          return (text === 'true') as unknown as T;
        }
      }
      break;
  }

  return '' as T;
}

/**
 * Extract fields from the collection config
 */
function extractFields(collectionConfig: ObjectLiteralExpression): FieldInfo[] {
  const fields: FieldInfo[] = [];

  const fieldsProp = collectionConfig.getProperty('fields');
  if (!fieldsProp || !Node.isPropertyAssignment(fieldsProp)) {
    return fields;
  }

  const fieldsValue = fieldsProp.getInitializer();
  if (!Node.isArrayLiteralExpression(fieldsValue)) {
    return fields;
  }

  for (const element of fieldsValue.getElements()) {
    if (Node.isObjectLiteralExpression(element)) {
      const field = parseField(element);
      if (field) {
        fields.push(field);
      }
    }
  }

  return fields;
}

/**
 * Parse a single field object
 */
function parseField(fieldObj: ObjectLiteralExpression): FieldInfo | null {
  const name = getPropertyValue<string>(fieldObj, 'name', 'string');
  const type = getPropertyValue<string>(fieldObj, 'type', 'string');
  const relationTo = getPropertyValue<string | undefined>(fieldObj, 'relationTo', 'optionalString');
  const hasMany = getPropertyValue<boolean | undefined>(fieldObj, 'hasMany', 'boolean');

  if (!name || !type) {
    return null;
  }

  return {
    name,
    type,
    relationTo,
    hasMany: hasMany || undefined,
  };
}

/**
 * Build relationship info from fields
 */
function buildRelationships(fields: FieldInfo[], collectionSlug: string): RelationshipInfo[] {
  const relationships: RelationshipInfo[] = [];

  for (const field of fields) {
    if (field.type === 'relationship' && field.relationTo) {
      const relationType = field.hasMany ? 'hasMany' : 'belongsTo';

      relationships.push({
        fromCollection: collectionSlug,
        fromField: field.name,
        toCollection: field.relationTo,
        relationType,
      });
    }
  }

  return relationships;
}