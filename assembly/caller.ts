import { Address, Args, call } from '@massalabs/massa-as-sdk';

export function main(): i32 {
  const address = new Address(
    'A12DE3MjJqjCbBeTvuxV51GXZvw4mduLqHS43Gzy6rAWyiJAiRxK',
  );
  call(address, 'sum', new Args().add(1 as i32).add(20 as i32), 0);
  return 0;
}