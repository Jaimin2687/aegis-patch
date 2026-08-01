import fs from 'fs';

/**
 * Parse package-lock.json and build a dependency map
 * @param {string} lockfilePath 
 * @returns {{ packages: Map, totalDeps: number, maxDepth: number }}
 */
export function parseLockfile(lockfilePath) {
  const lockfileContent = fs.readFileSync(lockfilePath, 'utf-8');
  const lockData = JSON.parse(lockfileContent);
  const packagesMap = new Map();
  let maxDepth = 0;

  if (lockData.packages) {
    // v2 or v3 lockfile
    for (const [pkgPath, pkgData] of Object.entries(lockData.packages)) {
      if (!pkgPath) continue; // Skip root package
      
      const name = pkgPath.split('node_modules/').pop();
      const depth = (pkgPath.match(/node_modules\//g) || []).length;
      maxDepth = Math.max(maxDepth, depth);

      packagesMap.set(name, {
        name,
        version: pkgData.version,
        path: pkgPath,
        depth,
        dependencies: pkgData.dependencies || {}
      });
    }
  } else if (lockData.dependencies) {
    // v1 lockfile, recurse
    const processDeps = (deps, currentPath, currentDepth) => {
      for (const [name, pkgData] of Object.entries(deps)) {
        const fullPath = currentPath ? `${currentPath}/node_modules/${name}` : `node_modules/${name}`;
        maxDepth = Math.max(maxDepth, currentDepth);
        packagesMap.set(name, {
          name,
          version: pkgData.version,
          path: fullPath,
          depth: currentDepth,
          dependencies: pkgData.requires || {}
        });
        if (pkgData.dependencies) {
          processDeps(pkgData.dependencies, fullPath, currentDepth + 1);
        }
      }
    };
    processDeps(lockData.dependencies, '', 1);
  }

  return {
    packages: packagesMap,
    totalDeps: packagesMap.size,
    maxDepth
  };
}

/**
 * Extract package list for OSV batch query
 * @param {Map} packages 
 * @returns {Array<{name: string, version: string}>} Array of { name, version }
 */
export function getPackageList(packages) {
  const list = [];
  for (const pkg of packages.values()) {
    list.push({ name: pkg.name, version: pkg.version });
  }
  return list;
}
