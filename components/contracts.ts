/* eslint-disable camelcase */

import { buildContracts } from 'ethers-deploy-or-attach';
import { ethers } from 'hardhat';
import {
    TestERC721__factory,
    Drop__factory,
    Store__factory,
    CryptoPunksMarket__factory,
    CryptopunksInterface__factory,
    CustomTokenInterface__factory,
    CustomNFT__factory,
    TestERC20__factory
} from '../typechain';

export const contracts = {
    CustomNFT: CustomNFT__factory,
    CustomTokenInterface: CustomTokenInterface__factory,
    TestERC20: TestERC20__factory,
    TestERC721: TestERC721__factory,
    Drop: Drop__factory,
    Store: Store__factory,
    CryptoPunksMarket: CryptoPunksMarket__factory,
    CryptopunksInterface: CryptopunksInterface__factory
};

const builtContracts = buildContracts(contracts, ethers);
export default builtContracts;
