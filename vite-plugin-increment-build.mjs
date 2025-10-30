import fs from 'fs';
import path from 'path';

/**
 * Vite plugin to increment build number on each build
 */
export default function incrementBuild() {
  return {
    name: 'increment-build',
    buildStart() {
      const buildInfoPath = path.resolve('build-info.json');

      let buildInfo = { buildNumber: 0 };

      // Read existing build info
      if (fs.existsSync(buildInfoPath)) {
        const content = fs.readFileSync(buildInfoPath, 'utf-8');
        try {
          buildInfo = JSON.parse(content);
        } catch (err) {
          console.warn(`Warning: Failed to parse build-info.json. Using default build info. Error: ${err.message}`);
          buildInfo = { buildNumber: 0 };
        }
      }

      // Increment build number
      buildInfo.buildNumber = (buildInfo.buildNumber || 0) + 1;

      // Write back to file
      fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

      console.log(`Build #${buildInfo.buildNumber}`);
    }
  };
}
