///////////////////////////////
////////////////////////////
////////////////////////
// ERC721 Implementation
////////////////////////
////////////////////////////
///////////////////////////////

import {
  Storage,
  Context,
  generateEvent,
  Args
} from "@massalabs/massa-as-sdk";
import { addressToBytes, stringFromBytes, stringToBytes, u64FromBytes, u64ToBytes } from "./utils";


const ownerTokenKey: string = "ownerOf_";
const counterKey: string = "Counter";
const ownerKey: string = "Owner";
const minterKey: string = "Minter";
const nameKey: string = "name";
const symbolKey: string = "symbol";
const maxSupplyKey: string = "maxSupply";
const baseURIKey: string = "baseURI";
//const initCounter: u64 = 0;

/**
 * The NFT's main characteristics
 */

// const _name: string = "MASSA_NFT";
// const _symbol: string = "NFT";
// const _maxSupply: string = "10000";
// const _baseURI: string = "massa.net/nft/";

/**
 * Init the NFT with name, symbol, maxSupply and baseURI,
 * init the counter to 0, the owner of the contract.
 * @param {StaticArray<u8>} _ - nftName, nftSymbol, nftMaxSupply, nftBaseURI
 *
 * @return {StaticArray<u8>}
 */
export function setNFT(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_serializedArgs);

  const nftName = args.nextString();
  const nftSymbol = args.nextString();
  const nftMaxSupply = args.nextU64();
  const nftBaseURI = args.nextString();

  const serializedCounterKey = stringToBytes(counterKey);
  if (!Storage.has(serializedCounterKey)) {
    Storage.set(stringToBytes(nameKey), stringToBytes(nftName));
    Storage.set(stringToBytes(symbolKey), stringToBytes(nftSymbol));
    Storage.set(stringToBytes(maxSupplyKey), u64ToBytes(nftMaxSupply));
    Storage.set(stringToBytes(baseURIKey), stringToBytes(nftBaseURI));
    Storage.set(stringToBytes(ownerKey), addressToBytes(Context.caller()));
    Storage.set(serializedCounterKey, u64ToBytes(0));

    generateEvent(
      `${nftName} with symbol ${nftSymbol} and total supply of ${nftMaxSupply} is well setted`
    );
  } else {
    generateEvent(`NFT already setted`);
  }
  return [];
}

/**
 * Change the base URI, can be only called by the contract Owner
 * @param {string} newBaseURI new link include in the NFTs
 * @return {string}
 */
export function setURI(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_serializedArgs);
  const newBaseURI = args.nextString();

  if (_onlyOwner("")) {
    Storage.set(stringToBytes(baseURIKey), stringToBytes(newBaseURI));
    generateEvent(`new base URI ${newBaseURI} well setted`);
  } else {
    generateEvent(`you are not the contract Owner`);
  }
  return [];
}

export function setMinter(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_serializedArgs);
  const toSetMinter = args.nextAddress();

  if (_onlyOwner("")) {
    Storage.set(stringToBytes(minterKey), addressToBytes(toSetMinter));
    generateEvent(`new minter ${toSetMinter.toByteString()} well setted`);
  } else {
    generateEvent(`you are not the contract Owner`);
  }
  return [];
}

export function transferOwnership(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_serializedArgs);
  const newOwner = args.nextAddress();

  if (_onlyOwner("")) {
    Storage.set(stringToBytes(ownerKey), addressToBytes(newOwner));
    generateEvent(`new owner ${newOwner.toByteString()} well setted`);
  } else {
    generateEvent(`you are not the contract Owner`);
  }
  return [];
}

// ======================================================== //
// ====                 TOKEN ATTRIBUTES                ==== //
// ======================================================== //

/**
 * Return the NFT's name
 * @param {string} _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @return {string}
 */
export function name(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(stringToBytes(nameKey));
}

/**
 * Return the NFT's symbol
 * @param {string} _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @return {string}
 */
export function symbol(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(stringToBytes(symbolKey));
}

/**
 * Return the token URI (external link written in NFT where pictures or others are stored)
 * @param {string} tokenId
 * @return {string}
 */
export function tokenURI(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_serializedArgs);
  const tokenId = args.nextU64();
  const serializedBaseURIKey = stringToBytes(baseURIKey);
  if (Storage.has(serializedBaseURIKey)) {
    return stringToBytes(
      stringFromBytes(Storage.get(serializedBaseURIKey)) + tokenId.toString()
    );
  } else {
    return [];
  }
}

/**
 * Return base URI
 * @param {string} _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @return {string}
 */
export function baseURI(_: StaticArray<u8>): StaticArray<u8> {
  const serializedBaseURIKey = stringToBytes(baseURIKey);
  if (Storage.has(serializedBaseURIKey)) {
    return Storage.get(serializedBaseURIKey);
  } else {
    return [];
  }
}

/**
 * Return the max supply possible
 * @param {string} _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @return {string}
 */
export function limitSupply(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(stringToBytes(maxSupplyKey));
}

/**
 * Return the current counter, if 10 NFT minted, returns '10'.
 * @param {string} _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @return {string}
 */
export function currentSupply(_: StaticArray<u8>): StaticArray<u8> {
  const serializedCounterKey = stringToBytes(counterKey);
  if (Storage.has(serializedCounterKey)) {
    return Storage.get(serializedCounterKey);
  } else {
    return [];
  }
}

/**
 * Return the tokenId's owner
 * @param {string} tokenId
 * @return {string}
 */
export function ownerOf(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_serializedArgs);
  const tokenId = args.nextU64();
  const tokenKey = stringToBytes(ownerTokenKey + tokenId.toString());
  if (Storage.has(tokenKey)) {
    return Storage.get(tokenKey);
  } else {
    return [];
  }
}

export function contractOwner(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(stringToBytes(ownerKey))
}

export function minter(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(stringToBytes(minterKey))
}

// ==================================================== //
// ====                 TRANSFER                   ==== //
// ==================================================== //

/**
 * The to address becomes the owner of the next token (if current tokenID = 10, will mint 11 )
 * Check if max supply is not reached
 * @param {string} args - byte string containing an owner's account (Address).
 * @return {string}
 */
export function mint(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
  if (!_onlyMinter("")) {
    generateEvent("only minter can mint");
    return []
  }
  const supply = u64FromBytes(currentSupply([]));
  const maxSupply = u64FromBytes(limitSupply([]));
  if (maxSupply > supply) {
    const args = new Args(_serializedArgs);
    const addr = args.nextAddress();
    _increment();
    const tokenID: string = supply.toString();
    const key = ownerTokenKey + tokenID;
    Storage.set(stringToBytes(key), addressToBytes(addr));
    generateEvent(`tokenId ${tokenID} minted to ${addr.toByteString()} `);
  } else {
    generateEvent(`Max supply reached`);
  }
  return [];
}

/**
 * Increment the NFT counter
 * @return {string}
 */
function _increment(): u64 {
  const serializedCounterKey = stringToBytes(counterKey);
  const incr = u64FromBytes(Storage.get(serializedCounterKey)) + 1;
  Storage.set(serializedCounterKey, u64ToBytes(incr));
  return incr;
}

/**
 * Return true if the caller is the creator of the SC
 * @param {string} _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @return {bool}
 */
function _onlyOwner(_: string): bool {
  return (
    Context.caller().toByteString() == stringFromBytes(Storage.get(stringToBytes(ownerKey)))
  );
}

/**
 * Return true if the caller is the minter
 * @param {string} _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @return {bool}
 */
function _onlyMinter(_: string): bool {
  return (
    Context.caller().toByteString() == stringFromBytes(Storage.get(stringToBytes(minterKey)))
  );
}

/**
 * Return true if the caller is token's owner
 * @param {u64} tokenId the tokenID
 * @return {bool}
 */
function _onlyTokenOwner(tokenId: u64): bool {
  const argsOwnerOf = new Args().add(tokenId).serialize();
  return stringFromBytes(ownerOf(argsOwnerOf)) == Context.caller().toByteString();
}

// ==================================================== //
// ====                 TRANSFER                   ==== //
// ==================================================== //

/**
 * Transfer a chosen token from the caller to the to Address.
 * Check first the caller owns the token and if token minted.
 * @param {string} args - byte string with the following format:
 * - the recipient's account (address)
 * - the tokenID (u64).
 * @return {string}
 */
export function transfer(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_serializedArgs);
  const toAddress = args.nextAddress();
  const tokenId = args.nextU64();
  const tokenKey = stringToBytes(ownerTokenKey + tokenId.toString());
  if (!Storage.has(tokenKey)) {
    generateEvent(`not minted`);
    generateEvent(`token ${tokenId.toString()} not yet minted`);
    return [];
  }
  if (_onlyTokenOwner(tokenId)) {
    generateEvent(`minted`);
    Storage.set(tokenKey, addressToBytes(toAddress));
    generateEvent(
      `token ${tokenId.toString()} sent from ${Context.caller().toByteString()} to ${toAddress.toByteString()}`
    );
  } else {
    generateEvent(`You are not the owner of ${tokenId.toString()}`);
  }
  return [];
}
