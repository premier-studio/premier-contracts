import { Signer } from '@ethersproject/abstract-signer';
import { ethers } from 'hardhat';
import { initDeployOrAttach, buildContracts } from 'ethers-deploy-or-attach';
import {
    TestERC721__factory,
    Drop__factory,
    Store__factory,
    ERC721__factory,
    CryptoPunksMarket__factory,
    CryptopunksInterface__factory
} from '../typechain';

const { deployOrAttach, attach } = initDeployOrAttach(ethers);

export default buildContracts((signer?: Signer) => {
    return {
        Drop: deployOrAttach(Drop__factory, signer),
        Store: deployOrAttach(Store__factory, signer),
        //
        CryptoPunksMarket: deployOrAttach(CryptoPunksMarket__factory, signer),
        CryptopunksInterface: deployOrAttach(CryptopunksInterface__factory, signer),
        //
        //
        //
        ERC721: deployOrAttach(ERC721__factory, signer),
        TestERC721: deployOrAttach(TestERC721__factory, signer)
    };
});
