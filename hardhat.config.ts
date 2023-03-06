import 'tsconfig-paths/register';

import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';

import 'hardhat-deploy';

import { HardhatUserConfig } from 'hardhat/config';
import process from 'process';
import { forkConfig } from './hardhat.fork.config';

const env = process.env as any;

// Paths
const DEFAULT_DEPLOY_DIR = './deploy/_default/';
const DEFAULT_SETUP_TEST_DIR = './deploy/_setup/';

// Networks
const MAINNET = 'MAINNET';
const GOERLI = 'GOERLI';

// Users
const HARDHAT_DEPLOYER = 'HARDHAT_DEPLOYER';
const HARDHAT_USER = 'HARDHAT_USER';

// Secret API
const ETHERSCAN_API = 'ETHERSCAN_API';

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            forking: forkConfig,
            chainId: 1337,
            accounts: [
                {
                    privateKey: env[HARDHAT_DEPLOYER], // deployer
                    balance: '10000000000000000000000000000000000000000000000'
                },
                {
                    privateKey: env[HARDHAT_USER], // user
                    balance: '10000000000000000000000000000000000000000000000'
                }
            ],
            allowUnlimitedContractSize: true,
            deploy: [DEFAULT_DEPLOY_DIR, DEFAULT_SETUP_TEST_DIR]
        },
        localhost: {
            deploy: [DEFAULT_DEPLOY_DIR]
        },
        mainnet: {
            url: env[MAINNET],
            deploy: [DEFAULT_DEPLOY_DIR, './deploy/mainnet']
        },
        goerli: {
            url: env[GOERLI],
            chainId: 5,
            deploy: [DEFAULT_DEPLOY_DIR, './deploy/goerli'],
            accounts: [env[HARDHAT_DEPLOYER]],
            gasPrice: 10000000 // 0.01 Gwei
        }
    },

    etherscan: {
        apiKey: env[ETHERSCAN_API]
    },

    namedAccounts: {
        deployer: 0,
        user: 1
    },

    solidity: {
        compilers: [
            {
                version: '0.8.14',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    },
                    metadata: {
                        bytecodeHash: 'none'
                    },
                    outputSelection: {
                        '*': {
                            '*': ['storageLayout'] // Enable slots, offsets and types of the contract's state variables
                        }
                    }
                }
            },
            {
                version: '0.4.11',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        ]
    },

    typechain: {
        outDir: 'typechain'
    },

    mocha: {
        timeout: 600000,
        color: true
    }
};

export default config;
