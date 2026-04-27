import { baseApi } from '../baseApi';

export const snapshotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDailySnapshots: builder.query<any, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) => `/daily-snapshots?startDate=${startDate}&endDate=${endDate}`,
    }),
  }),
});

export const { useGetDailySnapshotsQuery } = snapshotApi;
