/* eslint-disable camelcase */

import { Drop__factory, Store__factory, TestERC20__factory, TestERC721__factory } from '@premier-typechain';

export const contracts = {
    TestERC20: TestERC20__factory,
    TestERC721: TestERC721__factory,
    Drop: Drop__factory,
    Store: Store__factory
};

export default contracts;
