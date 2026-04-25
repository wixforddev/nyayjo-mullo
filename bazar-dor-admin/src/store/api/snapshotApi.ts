import { baseApi } from '../baseApi';

export const snapshotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSnapshots: builder.query<any, { startDate?: string; endDate?: string }>({
      query: ({ startDate, endDate } = {}) => {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate)   params.set('endDate', endDate);
        return `/daily-snapshots?${params.toString()}`;
      },
      providesTags: ['DailySnapshot'],
    }),
    triggerSnapshot: builder.mutation<any, void>({
      query: () => ({ url: '/daily-snapshots/trigger', method: 'POST' }),
      invalidatesTags: ['DailySnapshot'],
    }),
  }),
});

export const { useGetSnapshotsQuery, useTriggerSnapshotMutation } = snapshotApi;
