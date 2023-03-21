import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import Contracts from '@premier-contracts/components/contracts';

import { ListMockTokens } from '@premier-contracts/mock';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts } = hre;

    const { user } = await getNamedAccounts();
    const userSigner = await ethers.getSigner(user);

    for (const listName in ListMockTokens) {
        const list = ListMockTokens[listName];

        await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [list.owner]
        });
        const signer = await ethers.getSigner(list.owner);
        const contract = (await Contracts.TestERC721.attach(list.contract)).connect(signer);

        for (const boredApeX in list.tokens) {
            await contract.transferFrom(signer.address, userSigner.address, boredApeX);
        }

        console.log(`Populated ${(await contract.balanceOf(userSigner.address)).toNumber()} [${listName}]`);
    }
};

export default func;
