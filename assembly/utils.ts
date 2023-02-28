import { Address, Args, Context, transferCoins } from "@massalabs/massa-as-sdk";

export function stringFromBytes(byteArray: StaticArray<u8>): string {
    let str = changetype<string>(__new(byteArray.length, idof<string>()));
    memory.copy(changetype<usize>(str), changetype<usize>(byteArray), byteArray.length);
    return str;
}

export function stringToBytes(str: string): StaticArray<u8> {
    let arr = new StaticArray<u8>(str.length << 1);
    memory.copy(changetype<usize>(arr), changetype<usize>(str), arr.length);
    return arr;
}

export function addressFromBytes(byteArray: StaticArray<u8>): Address {
    return new Address(stringFromBytes(byteArray))
}


export function addressToBytes(addr: Address): StaticArray<u8> {
    return stringToBytes(addr.toByteString())
}

export function u32FromBytes(byteArray: StaticArray<u8>): u32 {
    return _toU32(uint8ArrayFromBytes(byteArray))
}

export function u32ToBytes(number: u32): StaticArray<u8> {
    return uint8ArrayToBytes(_fromU32(number))
}

export function u64FromBytes(byteArray: StaticArray<u8>): u64 {
    const arr = uint8ArrayFromBytes(byteArray)
    if (arr.length < sizeof<u64>()) {
        return <u64>NaN;
    }

    let x: u64 = 0;
    x = (x | _toU32(arr, 4)) << 32;
    x = x | _toU32(arr, 0);
    return x;
}

export function u64ToBytes(number: u64): StaticArray<u8> {
    let arr = new Uint8Array(8);
    let firstPart: u32 = (number >> 32) as u32;
    arr.set(_fromU32(firstPart), 4);
    arr.set(_fromU32(number as u32));
    return uint8ArrayToBytes(arr)
}

export function f32FromBytes(byteArray: StaticArray<u8>): f32 {
    if (byteArray.length < 4) {
        return <f32>NaN;
    }

    return reinterpret<f32>(bswap<u32>(u32FromBytes(byteArray)))
}

export function f32ToBytes(number: f32): StaticArray<u8> {
    return u32ToBytes(bswap<u32>(reinterpret<u32>(number)))
}

export function f64FromBytes(byteArray: StaticArray<u8>): f64 {
    if (byteArray.length < 8) {
        return <f64>NaN;
    }

    return reinterpret<f64>(bswap<u64>(u64FromBytes(byteArray)))
}

export function f64ToBytes(number: f64): StaticArray<u8> {
    return u64ToBytes(bswap<u64>(reinterpret<u64>(number)))
}

export function uint8ArrayToBytes(arr: Uint8Array): StaticArray<u8> {
    let array: Array<u8> = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        array[i] = arr[i];
    }
    return StaticArray.fromArray(array);
}

export function uint8ArrayFromBytes(byteArray: StaticArray<u8>): Uint8Array {
    let arr: Uint8Array = new Uint8Array(byteArray.length);
    for (let i = 0; i < byteArray.length; i++) {
        arr[i] = byteArray[i];
    }
    return arr
}

export function argsConcat(args1: Args, args2: Args): Args {
    const serializedArgs1 = uint8ArrayFromBytes(args1.serialize());
    const serializedArgs2 = uint8ArrayFromBytes(args2.serialize());
    return new Args(uint8ArrayToBytes(_concatArrays(serializedArgs1, serializedArgs2)))
}

// export function argsAppend(args1: Args, serializedArgs2: Uint8Array): Args {
//     const serializedArgs1 = uint8ArrayFromBytes(args1.serialize());
//     return new Args(uint8ArrayToBytes(_concatArrays(serializedArgs1, serializedArgs2)))
// }

export function joinArrays(
    array1: StaticArray<u8>, fromIndex1: u32, toIndex1: u32,
    array2: StaticArray<u8>, fromIndex2: u32, toIndex2: u32
): StaticArray<u8> {
    const len1 = toIndex1 - fromIndex1 + 1;
    const len2 = toIndex2 - fromIndex2 + 1;
    let array: Array<u8> = new Array(len1 + len2);
    for (let i: u32 = 0; i < len1; i++) {
        array[i] = array1[i + fromIndex1]
    }
    for (let i: u32 = len1; i < len1 + len2; i++) {
        array[i] = array2[i - len1 + fromIndex2]
    }

    return StaticArray.fromArray(array)
}

export function self(_: string): Address {
    return Context.addressStack()[Context.addressStack().length - 1]
}

export function refund(_: string): u64 {
    const toRefundAmt = Context.transferedCoins();
    if (toRefundAmt > 0) {
        transferCoins(Context.caller(), toRefundAmt)
    }

    return toRefundAmt
}

//---------------------------------------------------------------
// Private functions --------------------------------------------
//---------------------------------------------------------------

function _toU32(arr: Uint8Array, offset: u8 = 0): u32 {
    if (arr.length - offset < sizeof<u32>()) {
        return <u32>NaN;
    }

    let x: u32 = 0;
    for (let i = 3; i >= 1; --i) {
        x = (x | arr[offset + i]) << 8;
    }
    x = x | arr[offset];
    return x;
}

function _fromU32(number: u32): Uint8Array {
    const arr = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
        arr[i] = u8(number >> (i * 8));
    }
    return arr;
}

function _concatArrays(a: Uint8Array, b: Uint8Array): Uint8Array {
    var c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}