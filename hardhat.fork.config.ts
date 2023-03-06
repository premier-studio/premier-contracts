import 'dotenv/config';

import { HardhatNetworkForkingUserConfig } from 'hardhat/types';

enum networks {
    MAINNET = 'MAINNET',
    //
    NONE = ''
}

interface envOptions {
    // urls
    MAINNET: string;

    // fork options
    FORK?: networks;
    FORK_BN?: number;
}

const env = process.env as any as envOptions;

export const forkConfig: HardhatNetworkForkingUserConfig | undefined = (() => {
    if (env.FORK === undefined || env.FORK === networks.NONE) return undefined;

    return { url: env[env.FORK], blockNumber: Number(env.FORK_BN) };
})();
