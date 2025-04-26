import fs from 'fs';
import path from 'path';

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

const PACKAGES_DIR = path.join(process.cwd(), 'packages');

function readPackageJson(packagePath: string): PackageJson | null {
  const packageJsonPath = path.join(packagePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
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

function main() {
  const workspacePackages = new Map<string, string>();
  const packageDirs = fs.readdirSync(PACKAGES_DIR)

  packageDirs.forEach(dir => {
    const packagePath = path.join(PACKAGES_DIR, dir);
    const packageJson = readPackageJson(packagePath);
    if (packageJson) {
      workspacePackages.set(packageJson.name, packageJson.version);
    }
  });

  packageDirs.forEach(dir => {
    const packagePath = path.join(PACKAGES_DIR, dir);
    const packageJson = readPackageJson(packagePath);
    if (packageJson) {
      const updatedPackageJson = updateDependencies(packageJson, workspacePackages);
      fs.writeFileSync(
        path.join(packagePath, 'package.json'),
        JSON.stringify(updatedPackageJson, null, 2) + '\n'
      );
    }
  });
}

main(); 