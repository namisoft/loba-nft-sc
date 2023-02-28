import { Address, Args, call } from '@massalabs/massa-as-sdk';

export function main(): i32 {
  const address = new Address(
    'A1RJdKxCwacHrcMVUMq6y2khCbY3f7zQ8VrRh1jfnWFFXHx5dhw',
  );
  
  call(address, 'setNFT', new Args(), 1_000_000_000);
  //call(address, 'setNFT', new Args([]), 0);
  return 0;
}