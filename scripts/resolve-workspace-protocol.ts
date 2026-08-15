import fs from 'node:fs/promises';
import path from 'path';

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

const PACKAGES_DIR = path.join(process.cwd(), 'packages');

async function readPackageJson(packagePath: string): Promise<PackageJson | null> {
  const packageJsonPath = path.join(packagePath, 'package.json');
  try {
    return JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

function updateDependencies(packageJson: PackageJson, workspacePackages: Map<string, string>): PackageJson {
  const updateDeps = (deps: Record<string, string> | undefined) => {
    if (!deps) return deps;
    
    return Object.entries(deps).reduce((acc, [name, version]) => {
      if (version === 'workspace:*' && workspacePackages.has(name)) {
        acc[name] = workspacePackages.get(name)!;
      } else {
        acc[name] = version;
      }
      return acc;
    }, {} as Record<string, string>);
  };

  return {
    ...packageJson,
    dependencies: updateDeps(packageJson.dependencies),
    devDependencies: updateDeps(packageJson.devDependencies),
    peerDependencies: updateDeps(packageJson.peerDependencies),
  };
}

async function main() {
  const workspacePackages = new Map<string, string>();
  const packageDirs = await fs.readdir(PACKAGES_DIR);

  for (const dir of packageDirs) {
    const packagePath = path.join(PACKAGES_DIR, dir);
    const packageJson = await readPackageJson(packagePath);
    if (packageJson) {
      workspacePackages.set(packageJson.name, packageJson.version);
    }
  }

  for (const dir of packageDirs) {
    const packagePath = path.join(PACKAGES_DIR, dir);
    const packageJson = await readPackageJson(packagePath);
    if (packageJson) {
      const updatedPackageJson = updateDependencies(packageJson, workspacePackages);
      await fs.writeFile(
        path.join(packagePath, 'package.json'),
        JSON.stringify(updatedPackageJson, null, 2) + '\n'
      );
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
