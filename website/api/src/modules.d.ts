declare module "transit-immutable-js" {
  import { Record } from "immutable";
  class TransitImmutable {
    static withRecords(records: Record[]): TransitImmutable;
    toJSON(data: any): any;
    fromJSON<T = any>(data: any): T;
  }
  export = TransitImmutable;
}
