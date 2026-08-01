import fs from 'fs';
import path from 'path';

/**
 * Parses npm package-lock.json
 */
export function parseNpmLockfile(lockfilePath) {
  if (!fs.existsSync(lockfilePath)) return { packages: new Map(), totalDeps: 0, maxDepth: 0 };
  const lockfileContent = fs.readFileSync(lockfilePath, 'utf-8');
  const lockData = JSON.parse(lockfileContent);
  const packagesMap = new Map();
  let maxDepth = 0;

  if (lockData.packages) {
    for (const [pkgPath, pkgData] of Object.entries(lockData.packages)) {
      if (!pkgPath) continue; 
      
      const name = pkgPath.split('node_modules/').pop();
      const depth = (pkgPath.match(/node_modules\//g) || []).length;
      maxDepth = Math.max(maxDepth, depth);

      packagesMap.set(name, { name, version: pkgData.version, path: pkgPath, depth });
    }
  } else if (lockData.dependencies) {
    const processDeps = (deps, currentDepth) => {
      for (const [name, pkgData] of Object.entries(deps)) {
        maxDepth = Math.max(maxDepth, currentDepth);
        packagesMap.set(name, { name, version: pkgData.version, depth: currentDepth });
        if (pkgData.dependencies) processDeps(pkgData.dependencies, currentDepth + 1);
      }
    };
    processDeps(lockData.dependencies, 1);
  }

  return { packages: packagesMap, totalDeps: packagesMap.size, maxDepth };
}

/**
 * Parses Python requirements.txt (simplified)
 */
export function parseRequirementsTxt(filePath) {
  if (!fs.existsSync(filePath)) return { packages: new Map(), totalDeps: 0, maxDepth: 1 };
  const content = fs.readFileSync(filePath, 'utf-8');
  const packagesMap = new Map();
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const match = line.match(/^([a-zA-Z0-9\-_]+)[=<>~]+([a-zA-Z0-9\-_\.]+)/);
    if (match) {
      packagesMap.set(match[1], { name: match[1], version: match[2], depth: 1 });
    }
  });

  return { packages: packagesMap, totalDeps: packagesMap.size, maxDepth: 1 };
}

/**
 * Parses Rust Cargo.toml (simplified dependency extraction)
 */
export function parseCargoLock(filePath) {
  if (!fs.existsSync(filePath)) return { packages: new Map(), totalDeps: 0, maxDepth: 1 };
  const content = fs.readFileSync(filePath, 'utf-8');
  const packagesMap = new Map();
  
  let currentPkg = null;
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('[[package]]')) {
      currentPkg = {};
    } else if (currentPkg && line.startsWith('name = ')) {
      currentPkg.name = line.split('"')[1];
    } else if (currentPkg && line.startsWith('version = ')) {
      currentPkg.version = line.split('"')[1];
      packagesMap.set(currentPkg.name, { name: currentPkg.name, version: currentPkg.version, depth: 1 });
      currentPkg = null;
    }
  });

  return { packages: packagesMap, totalDeps: packagesMap.size, maxDepth: 1 };
}

/**
 * Parses go.mod (simplified)
 */
export function parseGoMod(filePath) {
  if (!fs.existsSync(filePath)) return { packages: new Map(), totalDeps: 0, maxDepth: 1 };
  const content = fs.readFileSync(filePath, 'utf-8');
  const packagesMap = new Map();
  
  content.split('\n').forEach(line => {
    line = line.trim();
    // Match "require github.com/foo/bar v1.2.3" or just "github.com/foo/bar v1.2.3" inside require block
    if (line && !line.startsWith('module') && !line.startsWith('go ') && !line.startsWith('require (') && line !== ')') {
      const parts = line.replace(/^require\s+/, '').split(/\s+/);
      if (parts.length >= 2 && parts[1].startsWith('v')) {
        packagesMap.set(parts[0], { name: parts[0], version: parts[1].substring(1), depth: 1 });
      }
    }
  });

  return { packages: packagesMap, totalDeps: packagesMap.size, maxDepth: 1 };
}

/**
 * Routes to the correct lockfile parser based on ecosystem
 */
export async function parseDependencies(repoPath, ecosystem) {
  switch (ecosystem) {
    case 'npm':
      return parseNpmLockfile(path.join(repoPath, 'package-lock.json'));
    case 'PyPI':
      // Prefer requirements.txt for now
      return parseRequirementsTxt(path.join(repoPath, 'requirements.txt'));
    case 'crates.io':
      return parseCargoLock(path.join(repoPath, 'Cargo.lock'));
    case 'Go':
      return parseGoMod(path.join(repoPath, 'go.mod'));
    default:
      return { packages: new Map(), totalDeps: 0, maxDepth: 0 };
  }
}

/**
 * Extract package list for OSV batch query
 */
export function getPackageList(packages) {
  const list = [];
  for (const pkg of packages.values()) {
    list.push({ name: pkg.name, version: pkg.version });
  }
  return list;
}
