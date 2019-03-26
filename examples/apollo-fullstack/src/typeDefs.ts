import { RESTDataSource } from "apollo-datasource-rest";
import { DataSource } from "apollo-datasource";

export interface Mission {
  name: string;
  missionPatchSmall: string;
  missionPatchLarge: string;
}

export interface Rocket {
  id: number;
  name: string;
  type: string;
}

export interface Launch {
  id: number;
  cursor: string;
  site: string;
  mission: Mission;
  rocket: Rocket;
}

export interface DBUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  token: string;
}

export interface DBTrip {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  launchId: number;
  userId: number;
}

export interface LaunchApi extends RESTDataSource {
  getAllLaunches(): Promise<Launch[]>;
  getLaunchById(opts: { launchId: string }): Promise<Launch>;
  getLaunchesByIds(opts: { launchIds: string[] }): Promise<Launch[]>;
}

export interface UserApi extends DataSource {
  /**
   * User can be called with an argument that includes email, but it doesn't
   * have to be. If the user is already on the context, it will use that user
   * instead
   */
  findOrCreateUser(obj?: { email?: string | null }): Promise<DBUser | null>;
  bookTrips(obj: { launchIds: string[] }): Promise<DBTrip[]>;
  bookTrip(obj: { launchId: string }): Promise<DBTrip | false>;
  cancelTrip(obj: { launchId: string }): Promise<void>;
  getLaunchIdsByUser(): Promise<string[]>;
  isBookedOnLaunch(obj: { launchId: string }): boolean;
}

export interface Utils {
  paginateResults<T>(opts: {
    after?: string | null;
    pageSize?: number | null;
    results: T[];
    getCursor?: Function;
  }): T[];
  createStore(): {};
}

export interface Context {
  dataSources: {
    userAPI: UserApi;
    launchAPI: LaunchApi;
  };
}
