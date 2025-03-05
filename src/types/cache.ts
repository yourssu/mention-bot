export type BaseCache<TData> = {
  data: TData;
  duration: number;
  expireAt: number | undefined;
};
