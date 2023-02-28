import {
    generateEvent,
    createSC,
    fileToByteArray,
    call,
    Args,
    Storage,
    Context
} from "@massalabs/massa-as-sdk";
import { addressFromBytes, addressToBytes, refund, self, stringToBytes, u64FromBytes, u64ToBytes } from "./utils";


// storage keys
const erc721ScAddressKey: string = "Erc721ScAddr";
const dropLocationKey: string = "DropLocation";
const mintPriceKey: string = "MintPrice";

export function initialize(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
    if (_isInitialized("")) {
        generateEvent("already initialized");
        // coins refunding (if has)
        refund("");
        return []
    }

    // args parsing
    const args = new Args(_serializedArgs);
    const from = args.nextAddress();
    const nftName = args.nextString();
    const nftSymbol = args.nextString();
    const nftMaxSupply = args.nextU64();
    const nftBaseURI = args.nextString();
    const dropLat = args.nextF32();
    const dropLong = args.nextF32();
    const dropZone = args.nextF32();
    const mintPrice = args.nextU64();

    // create ERC721 contract
    let erc721BytesCode: StaticArray<u8> = fileToByteArray("build/erc721.wasm");
    const erc721ScAddress = createSC(erc721BytesCode);
    if (!erc721ScAddress.isValid()) {
        generateEvent(
            `create Erc721 contract: createSC returned an invalid address: ${erc721ScAddress.toByteString()}`
        );
        return [];
    }
    generateEvent(
        `Erc721 contract created at address: ${erc721ScAddress.toByteString()}`
    );

    // set NFT info + send coin to the contract
    call(
        erc721ScAddress,
        "setNFT",
        new Args()
            .add(nftName)
            .add(nftSymbol)
            .add(nftMaxSupply)
            .add(nftBaseURI),
        5_000_000_000
    );

    // set minter to this contract
    call(
        erc721ScAddress,
        "setMinter",
        new Args().add(self("")),
        0
    );

    // transfer ERC721 contract owner to `from`
    call(
        erc721ScAddress,
        "transferOwnership",
        new Args().add(from),
        0
    );


    // save neccessary info to the storage
    Storage.set(stringToBytes(erc721ScAddressKey), addressToBytes(erc721ScAddress));

    Storage.set(
        stringToBytes(dropLocationKey),
        new Args()
            .add(dropLat)
            .add(dropLong)
            .add(dropZone)
            .serialize()
    );

    Storage.set(stringToBytes(mintPriceKey), u64ToBytes(mintPrice));

    return [];
}

export function getErc721ScAddress(_: StaticArray<u8>): StaticArray<u8> {
    return Storage.get(stringToBytes(erc721ScAddressKey))
}

export function getDropLocation(_: StaticArray<u8>): StaticArray<u8> {
    return Storage.get(stringToBytes(dropLocationKey))
}

export function mintErc721(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
    if (!_isInitialized("")) {
        generateEvent("not initialized yet");
        return []
    }

    // check received coins against mint price
    const mintPrice = u64FromBytes(Storage.get(stringToBytes(mintPriceKey)));
    if (Context.transferedCoins() < mintPrice) {
        generateEvent("not enough fund to mint");
        return []
    }
    // TODO: if `transfered coin > mint price` --> refund?

    const args = new Args(_serializedArgs);
    const toAddr = args.nextAddress();
    const lat = args.nextF32();
    const long = args.nextF32();
    const locationProof = args.nextUint8Array();

    // TODO: verify the `locationProof`

    // check whether location is in the drop zone or not
    const dropLocationInfo = new Args(Storage.get(stringToBytes(dropLocationKey)));
    const dropLat = dropLocationInfo.nextF32();
    const dropLong = dropLocationInfo.nextF32();
    const dropZone = dropLocationInfo.nextF32();

    if (dropZone > 0 && _distance(lat, long, dropLat, dropLong) > dropZone) {
        generateEvent("out of drop zone")
        return [];
    }

    const erc721ScAddress = addressFromBytes(Storage.get(stringToBytes(erc721ScAddressKey)));
    call(
        erc721ScAddress,
        "mint",
        new Args().add(toAddr),
        0
    );

    const mintTokenId = u64FromBytes(call(erc721ScAddress, "currentSupply", new Args(), 0));

    generateEvent(
        `ERC721 token for ${toAddr.toByteString()} with location: lat=${lat}, long=${long} minted successfully. TokenId=${mintTokenId}`
    );

    return [];
}

//---------------------------------------------------------------
// Private functions --------------------------------------------
//---------------------------------------------------------------

function _isInitialized(_: string): bool {
    return Storage.has(stringToBytes(erc721ScAddressKey))
}

// Calculate the distance between two geo points; result is in meters
function _distance(lat1: f32, lon1: f32, lat2: f32, lon2: f32): f32 {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;

    return f32(12742000) * f32(Math.asin(Math.sqrt(a))); // 2 * R; R = 6371000 m
}
