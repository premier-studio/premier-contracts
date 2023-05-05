/* eslint-disable indent */
import 'dotenv/config';
import 'tsconfig-paths/register';

import process from 'process';

import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomicfoundation/hardhat-chai-matchers';

import 'hardhat-gas-reporter';

import '@typechain/hardhat';

import 'hardhat-deploy';

import { HardhatUserConfig } from 'hardhat/config';
import { HardhatNetworkForkingUserConfig } from 'hardhat/types';

// Paths
const COMMON_DEPLOY_DIR = './deploy/_common/';
const HARDHAT_DEPLOY_DIR = './deploy/hardhat/';
const GOERLI_DEPLOY_DIR = './deploy/goerli/';
const SEPOLIA_DEPLOY_DIR = './deploy/sepolia/';
//
const MAINNET_DEPLOY_DIR = './deploy/mainnet/';

enum Networks {
    GOERLI = 'GOERLI',
    SEPOLIA = 'SEPOLIA',
    MAINNET = 'MAINNET',
    //
    NONE = 'NONE'
}

interface EnvOptions {
    FORK?: Networks;
    FORK_BN?: string;
    HARDHAT_DEPLOYER?: string;
    HARDHAT_USER?: string;
    ETHERSCAN_API?: string;
    MAINNET_ENDPOINT?: string;
    GOERLI_ENDPOINT?: string;
    SEPOLIA_ENDPOINT?: string;
}

const {
    FORK = Networks.NONE,
    FORK_BN = '',
    HARDHAT_DEPLOYER = '',
    HARDHAT_USER = '',
    ETHERSCAN_API = '',
    MAINNET_ENDPOINT = '',
    GOERLI_ENDPOINT = '',
    SEPOLIA_ENDPOINT = ''
}: EnvOptions = process.env as EnvOptions;

const forkConfig: HardhatNetworkForkingUserConfig | undefined = (() => {
    if (FORK === undefined || FORK === Networks.NONE) return undefined;
    const url =
        FORK === Networks.MAINNET
            ? MAINNET_ENDPOINT
            : FORK === Networks.GOERLI
            ? GOERLI_ENDPOINT
            : FORK === Networks.SEPOLIA
            ? SEPOLIA_ENDPOINT
            : undefined;

    if (!url) throw Error('Fork URL is undefined');

    console.log('Forking network [', FORK, '], block number [', FORK_BN, ']');
    return { url, blockNumber: Number(FORK_BN) };
})();

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            forking: forkConfig,
            chainId: 1337,
            accounts:
                HARDHAT_DEPLOYER && HARDHAT_USER
                    ? [
                          {
                              privateKey: HARDHAT_DEPLOYER, // deployer
                              balance: '10000000000000000000000000000000000000000000000'
                          },
                          {
                              privateKey: HARDHAT_USER, // user
                              balance: '10000000000000000000000000000000000000000000000'
                          }
                      ]
                    : undefined,
            allowUnlimitedContractSize: true,
            deploy: [COMMON_DEPLOY_DIR, HARDHAT_DEPLOY_DIR]
        },

        goerli: {
            url: GOERLI_ENDPOINT,
            chainId: 5,
            deploy: [COMMON_DEPLOY_DIR, GOERLI_DEPLOY_DIR],
            gasPrice: 9000000000 // 9 Gwei
        },
        sepolia: {
            url: SEPOLIA_ENDPOINT,
            chainId: 11155111,
            deploy: [COMMON_DEPLOY_DIR, SEPOLIA_DEPLOY_DIR],
            gasPrice: 2000000000 // 2 Gwei
        },
        mainnet: {
            url: MAINNET_ENDPOINT,
            chainId: 1,
            deploy: [COMMON_DEPLOY_DIR, MAINNET_DEPLOY_DIR]
        }
    },

    etherscan: {
        apiKey: ETHERSCAN_API
    },

    namedAccounts: {
        deployer: {
            1337: 0,
            //
            1: "ledger://m/44'/60'/0'/3:0xf6Fc97De0dC943D3cEeEDD88C32bfea76A2d7AA1",
            5: "ledger://m/44'/60'/0'/3:0xf6Fc97De0dC943D3cEeEDD88C32bfea76A2d7AA1",
            11155111: "ledger://m/44'/60'/0'/3:0xf6Fc97De0dC943D3cEeEDD88C32bfea76A2d7AA1"
        },
        user: {
            1337: 1
            //
        }
    },

    solidity: {
        compilers: [
            {
                version: '0.8.18',
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
