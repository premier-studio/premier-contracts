import { ethers } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const { parseEther: toEth } = ethers.utils;
const { AddressZero } = ethers.constants;

describe('TokenInterfaceStore', () => {
    let owner: SignerWithAddress, user: SignerWithAddress;

    before(async () => {
        [owner, user] = await ethers.getSigners();
    });

    describe('construction', () => {});
});
