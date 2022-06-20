import example from './tasks/example';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import fs from 'fs';
// import 'hardhat-abi-exporter';
import 'hardhat-contract-sizer';
import 'hardhat-gas-reporter';
import 'hardhat-preprocessor';
// import 'hardhat-spdx-license-identifier';
import { HardhatUserConfig } from 'hardhat/config';
import 'solidity-coverage';

function getRemappings() {
  return fs
    .readFileSync('remappings.txt', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => line.trim().split('='));
}

// task('example', 'Example task').setAction(example);

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.14',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  // abiExporter: {
  //   runOnCompile: true,
  //   clear: true,
  //   flat: true,
  //   except: ['.*Mock$'],
  // },

  gasReporter: {
    enabled: true,
  },

  // spdxLicenseIdentifier: {
  //   overwrite: true,
  //   runOnCompile: true,
  // },

  typechain: {
    alwaysGenerateOverloads: true,
  },

  paths: {
    sources: './src', // Use ./src rather than ./contracts as Hardhat expects
    cache: './cache_hardhat', // Use a different cache for Hardhat than Foundry
  },

  // This fully resolves paths for imports in the ./lib directory for Hardhat
  preprocess: {
    eachLine: (hre) => ({
      transform: (line: string) => {
        if (line.match(/^\s*import /i)) {
          getRemappings().forEach(([find, replace]) => {
            if (line.match(find)) {
              line = line.replace(find, replace);
            }
          });
        }
        return line;
      },
    }),
  },
};

export default config;
