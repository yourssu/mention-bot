import { randomUUID } from 'node:crypto';

type AnyEventHandler = (...args: any[]) => void;

export const AllEvents = ['authorized'] as const;
export type AllEvents = (typeof AllEvents)[number];
export type Payloads = {
  authorized: {
    token: string;
  };
};

/* 
  동시성 처리를 위해 node:events를 사용하지 않고 이벤트 리스너를 저장하는 객체를 따로 만들어줘요.
*/
const eventStore: Partial<Record<AllEvents, Record<string, AnyEventHandler>>> = {};

export const addEventListenerOnce = <TEvent extends AllEvents>(
  key: TEvent,
  fn: (e: Payloads[TEvent]) => void
) => {
  const id = randomUUID();

  if (!eventStore[key]) {
    eventStore[key] = {};
  }
  eventStore[key][id] = fn;

  return id;
};

export const triggerExactEventListenerOnce = <TEvent extends AllEvents>(
  key: TEvent,
  id: string,
  payload: Payloads[TEvent]
) => {
  const fn = eventStore[key]?.[id];

  if (!fn) {
    throw new Error(`No such event listener: key: ${key}, id: ${id}`);
  }

  fn(payload);
  removeExactEventListener(key, id);

  setTimeout(
    () => {
      removeExactEventListener(key, id);
    },
    5 * 60 * 1000 // 5분
  );
};

export const removeExactEventListener = <TEvent extends AllEvents>(key: TEvent, id: string) => {
  delete eventStore[key]?.[id];
};
