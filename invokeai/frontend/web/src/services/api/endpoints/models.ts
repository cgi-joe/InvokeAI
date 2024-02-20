import type { EntityAdapter, EntityState } from '@reduxjs/toolkit';
import { createEntityAdapter } from '@reduxjs/toolkit';
import { getSelectorsOptions } from 'app/store/createMemoizedSelector';
import queryString from 'query-string';
import type { operations, paths } from 'services/api/schema';
import type {
  AnyModelConfig,
  BaseModelType,
  ControlNetConfig,
  IPAdapterConfig,
  LoRAConfig,
  MainModelConfig,
  MergeModelConfig,
  T2IAdapterConfig,
  TextualInversionConfig,
  VAEConfig,
} from 'services/api/types';

import type { ApiTagDescription, tagTypes } from '..';
import { api, buildV2Url, LIST_TAG } from '..';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const getModelId = (input: any): any => input;

type UpdateModelArg = {
  key: NonNullable<operations['update_model_record']['parameters']['path']['key']>,
  body: NonNullable<operations['update_model_record']['requestBody']['content']['application/json']>
}


type UpdateModelResponse =
  paths['/api/v2/models/i/{key}']['patch']['responses']['200']['content']['application/json'];

type ListModelsArg = NonNullable<paths['/api/v2/models/']['get']['parameters']['query']>;


type DeleteMainModelArg = {
  key: string
};

type DeleteMainModelResponse = void;

type ConvertMainModelArg = {
  base_model: BaseModelType;
  model_name: string;
  convert_dest_directory?: string;
};

type ConvertMainModelResponse =
  paths['/api/v2/models/convert/{key}']['put']['responses']['200']['content']['application/json'];

type MergeMainModelArg = {
  base_model: BaseModelType;
  body: MergeModelConfig;
};

type MergeMainModelResponse =
  paths['/api/v2/models/merge']['put']['responses']['200']['content']['application/json'];


type ImportMainModelArg = {
  source: NonNullable<operations['heuristic_import_model']['parameters']['query']['source']>,
  access_token?: operations['heuristic_import_model']['parameters']['query']['access_token'],
  config: NonNullable<operations['heuristic_import_model']['requestBody']['content']['application/json']>
}


type ImportMainModelResponse =
  paths['/api/v2/models/import']['post']['responses']['201']['content']['application/json'];

type ListImportModelsResponse = paths['/api/v2/models/import']['get']['responses']['200']['content']['application/json'];

type AddMainModelArg = {
  body: MainModelConfig;
};

type AddMainModelResponse = paths['/api/v2/models/add']['post']['responses']['201']['content']['application/json'];

type SyncModelsResponse = paths['/api/v2/models/sync']['post']['responses']['201']['content']['application/json'];

export type SearchFolderResponse =
  paths['/api/v2/models/search']['get']['responses']['200']['content']['application/json'];

type CheckpointConfigsResponse =
  paths['/api/v2/models/ckpt_confs']['get']['responses']['200']['content']['application/json'];

type SearchFolderArg = operations['search_for_models']['parameters']['query'];

export const mainModelsAdapter = createEntityAdapter<MainModelConfig, string>({
  selectId: (entity) => entity.key,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});
export const mainModelsAdapterSelectors = mainModelsAdapter.getSelectors(undefined, getSelectorsOptions);
export const loraModelsAdapter = createEntityAdapter<LoRAConfig, string>({
  selectId: (entity) => entity.key,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});
export const loraModelsAdapterSelectors = loraModelsAdapter.getSelectors(undefined, getSelectorsOptions);
export const controlNetModelsAdapter = createEntityAdapter<ControlNetConfig, string>({
  selectId: (entity) => entity.key,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});
export const controlNetModelsAdapterSelectors = controlNetModelsAdapter.getSelectors(undefined, getSelectorsOptions);
export const ipAdapterModelsAdapter = createEntityAdapter<IPAdapterConfig, string>({
  selectId: (entity) => entity.key,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});
export const ipAdapterModelsAdapterSelectors = ipAdapterModelsAdapter.getSelectors(undefined, getSelectorsOptions);
export const t2iAdapterModelsAdapter = createEntityAdapter<T2IAdapterConfig, string>({
  selectId: (entity) => entity.key,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});
export const t2iAdapterModelsAdapterSelectors = t2iAdapterModelsAdapter.getSelectors(undefined, getSelectorsOptions);
export const textualInversionModelsAdapter = createEntityAdapter<TextualInversionConfig, string>({
  selectId: (entity) => entity.key,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});
export const textualInversionModelsAdapterSelectors = textualInversionModelsAdapter.getSelectors(
  undefined,
  getSelectorsOptions
);
export const vaeModelsAdapter = createEntityAdapter<VAEConfig, string>({
  selectId: (entity) => entity.key,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});
export const vaeModelsAdapterSelectors = vaeModelsAdapter.getSelectors(undefined, getSelectorsOptions);

const buildProvidesTags =
  <TEntity extends AnyModelConfig>(tagType: (typeof tagTypes)[number]) =>
    (result: EntityState<TEntity, string> | undefined) => {
      const tags: ApiTagDescription[] = [{ type: tagType, id: LIST_TAG }, 'Model'];

      if (result) {
        tags.push(
          ...result.ids.map((id) => ({
            type: tagType,
            id,
          }))
        );
      }

      return tags;
    };

const buildTransformResponse =
  <T extends AnyModelConfig>(adapter: EntityAdapter<T, string>) =>
    (response: { models: T[] }) => {
      return adapter.setAll(adapter.getInitialState(), response.models);
    };

/**
 * Builds an endpoint URL for the models router
 * @example
 * buildModelsUrl('some-path')
 * // '/api/v1/models/some-path'
 */
const buildModelsUrl = (path: string = '') => buildV2Url(`models/${path}`);

export const modelsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMainModels: build.query<EntityState<MainModelConfig, string>, BaseModelType[]>({
      query: (base_models) => {
        const params: ListModelsArg = {
          model_type: 'main',
          base_models,
        };

        const query = queryString.stringify(params, { arrayFormat: 'none' });
        return buildModelsUrl(`?${query}`);
      },
      providesTags: buildProvidesTags<MainModelConfig>('MainModel'),
      transformResponse: buildTransformResponse<MainModelConfig>(mainModelsAdapter),
    }),
    updateModels: build.mutation<UpdateModelResponse, UpdateModelArg>({
      query: ({ key, body }) => {
        return {
          url: buildModelsUrl(`i/${key}`),
          method: 'PATCH',
          body: body,
        };
      },
      invalidatesTags: ['Model'],
    }),
    importMainModels: build.mutation<ImportMainModelResponse, ImportMainModelArg>({
      query: ({ source, config, access_token }) => {
        return {
          url: buildModelsUrl('heuristic_import'), params: { source, access_token },
          method: 'POST',
          body: config,
        };
      },
      invalidatesTags: ['Model'],
    }),
    addMainModels: build.mutation<AddMainModelResponse, AddMainModelArg>({
      query: ({ body }) => {
        return {
          url: buildModelsUrl('add'),
          method: 'POST',
          body: body,
        };
      },
      invalidatesTags: ['Model'],
    }),
    deleteModels: build.mutation<DeleteMainModelResponse, DeleteMainModelArg>({
      query: ({ key }) => {
        return {
          url: buildModelsUrl(`i/${key}`),
          method: 'DELETE',
        };
      },
      invalidatesTags: ['Model'],
    }),
    convertMainModels: build.mutation<ConvertMainModelResponse, ConvertMainModelArg>({
      query: ({ base_model, model_name, convert_dest_directory }) => {
        return {
          url: buildModelsUrl(`convert/${base_model}/main/${model_name}`),
          method: 'PUT',
          params: { convert_dest_directory },
        };
      },
      invalidatesTags: ['Model'],
    }),
    mergeMainModels: build.mutation<MergeMainModelResponse, MergeMainModelArg>({
      query: ({ base_model, body }) => {
        return {
          url: buildModelsUrl(`merge/${base_model}`),
          method: 'PUT',
          body: body,
        };
      },
      invalidatesTags: ['Model'],
    }),
    syncModels: build.mutation<SyncModelsResponse, void>({
      query: () => {
        return {
          url: buildModelsUrl('sync'),
          method: 'POST',
        };
      },
      invalidatesTags: ['Model'],
    }),
    getLoRAModels: build.query<EntityState<LoRAConfig, string>, void>({
      query: () => ({ url: buildModelsUrl(), params: { model_type: 'lora' } }),
      providesTags: buildProvidesTags<LoRAConfig>('LoRAModel'),
      transformResponse: buildTransformResponse<LoRAConfig>(loraModelsAdapter),
    }),
    getControlNetModels: build.query<EntityState<ControlNetConfig, string>, void>({
      query: () => ({ url: buildModelsUrl(), params: { model_type: 'controlnet' } }),
      providesTags: buildProvidesTags<ControlNetConfig>('ControlNetModel'),
      transformResponse: buildTransformResponse<ControlNetConfig>(controlNetModelsAdapter),
    }),
    getIPAdapterModels: build.query<EntityState<IPAdapterConfig, string>, void>({
      query: () => ({ url: buildModelsUrl(), params: { model_type: 'ip_adapter' } }),
      providesTags: buildProvidesTags<IPAdapterConfig>('IPAdapterModel'),
      transformResponse: buildTransformResponse<IPAdapterConfig>(ipAdapterModelsAdapter),
    }),
    getT2IAdapterModels: build.query<EntityState<T2IAdapterConfig, string>, void>({
      query: () => ({ url: buildModelsUrl(), params: { model_type: 't2i_adapter' } }),
      providesTags: buildProvidesTags<T2IAdapterConfig>('T2IAdapterModel'),
      transformResponse: buildTransformResponse<T2IAdapterConfig>(t2iAdapterModelsAdapter),
    }),
    getVaeModels: build.query<EntityState<VAEConfig, string>, void>({
      query: () => ({ url: buildModelsUrl(), params: { model_type: 'vae' } }),
      providesTags: buildProvidesTags<VAEConfig>('VaeModel'),
      transformResponse: buildTransformResponse<VAEConfig>(vaeModelsAdapter),
    }),
    getTextualInversionModels: build.query<EntityState<TextualInversionConfig, string>, void>({
      query: () => ({ url: buildModelsUrl(), params: { model_type: 'embedding' } }),
      providesTags: buildProvidesTags<TextualInversionConfig>('TextualInversionModel'),
      transformResponse: buildTransformResponse<TextualInversionConfig>(textualInversionModelsAdapter),
    }),
    getModelsInFolder: build.query<SearchFolderResponse, SearchFolderArg>({
      query: (arg) => {
        const folderQueryStr = queryString.stringify(arg, {});
        return {
          url: buildModelsUrl(`search?${folderQueryStr}`),
        };
      },
    }),
    getModelImports: build.query<ListImportModelsResponse, void>({
      query: (arg) => {
        return {
          url: buildModelsUrl(`import`),
        };
      },
    }),
    getCheckpointConfigs: build.query<CheckpointConfigsResponse, void>({
      query: () => {
        return {
          url: buildModelsUrl(`ckpt_confs`),
        };
      },
    }),
  }),
});

export const {
  useGetMainModelsQuery,
  useGetControlNetModelsQuery,
  useGetIPAdapterModelsQuery,
  useGetT2IAdapterModelsQuery,
  useGetLoRAModelsQuery,
  useGetTextualInversionModelsQuery,
  useGetVaeModelsQuery,
  useDeleteModelsMutation,
  useUpdateModelsMutation,
  useImportMainModelsMutation,
  useAddMainModelsMutation,
  useConvertMainModelsMutation,
  useMergeMainModelsMutation,
  useSyncModelsMutation,
  useGetModelsInFolderQuery,
  useGetCheckpointConfigsQuery,
  useGetModelImportsQuery
} = modelsApi;
