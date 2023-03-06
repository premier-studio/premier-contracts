//////////////////
////// DRIP //////
//////////////////
export enum DripStatus {
    DEFAULT,
    MUTATED
}

export const dripStatus = (dripStatus: DripStatus) => {
    switch (dripStatus) {
        case DripStatus.DEFAULT:
            return 'DEFAULT';
        case DripStatus.MUTATED:
            return 'MUTATED';
        default:
            return 'ERROR';
    }
};

export type Drips = Drip[];
export type Drip = {
    drop: Drop;
    //
    id: number;
    version: number;
    img: string;
    status: DripStatus;
    owner: string;
    nft?: NFT;
};

//////////////////
////// DROP //////
//////////////////
export type DropMetadata = {
    id: number;
    model: string;
    versions: { id: number; texture: string; color: string; name: string }[];
};

export type Drops = Drop[];
export type Drop = {
    address: string;
    symbol: string;
    id: number;
    maxSupply: number;
    price: string; // wei
    currentSupply: number;
    metadata: DropMetadata;
};

//////////////////
////// NFT ///////
//////////////////
export type NFTsByCollection = { collectionName: string; collectionSymbol: string; assets: NFTs }[];
export type NFTs = NFT[];
export type NFT = {
    address: string;
    name: string;
    symbol: string;
    img: string;
    id: number;
};

//////////////////
/// COLLECTION ///
//////////////////
export type Collection = {
    address: string;
    name: string;
    symbol: string;
    img: string;
    price: string;
};

/////////////////////
/// MISCELLANEOUS ///
/////////////////////
export type VersionMetadata = {
    imgUrl: string;
    versionColor: string;
    versionName: string;
};
