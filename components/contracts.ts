import { Signer } from '@ethersproject/abstract-signer';
import { ethers } from 'hardhat';
import { initDeployOrAttach, buildContracts } from 'ethers-deploy-or-attach';
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

const { deployOrAttach } = initDeployOrAttach(ethers);

export default buildContracts((signer?: Signer) => {
    return {
        Drop: deployOrAttach(Drop__factory, signer),
        Store: deployOrAttach(Store__factory, signer),
        //
        CryptoPunksMarket: deployOrAttach(CryptoPunksMarket__factory, signer),
        CryptopunksInterface: deployOrAttach(CryptopunksInterface__factory, signer),
        //
        TestERC721: deployOrAttach(TestERC721__factory, signer),
        TestERC20: deployOrAttach(TestERC20__factory, signer),
        //
        CustomNFT: deployOrAttach(CustomNFT__factory, signer),
        CustomTokenInterface: deployOrAttach(CustomTokenInterface__factory, signer)
    };
});
