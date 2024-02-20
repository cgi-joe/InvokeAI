import { Button, Divider, Flex, FormControl, FormErrorMessage, FormLabel, Input, Text } from '@invoke-ai/ui-library';
import { useAppDispatch } from 'app/store/storeHooks';
import BaseModelSelect from 'features/modelManager/subpanels/shared/BaseModelSelect';
import { LORA_MODEL_FORMAT_MAP, MODEL_TYPE_MAP } from 'features/parameters/types/constants';
import { addToast } from 'features/system/store/systemSlice';
import { makeToast } from 'features/system/util/makeToast';
import { memo, useCallback } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { LoRAConfig } from 'services/api/types';
import { useUpdateModelsMutation } from '../../../../services/api/endpoints/models';

type LoRAModelEditProps = {
  model: LoRAConfig;
};

const LoRAModelEdit = (props: LoRAModelEditProps) => {
  const { model } = props;

  const [updateModel, { isLoading }] = useUpdateModelsMutation();

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<LoRAConfig>({
    defaultValues: {
      name: model.name ? model.name : '',
      base: model.base,
      type: 'lora',
      path: model.path ? model.path : '',
      description: model.description ? model.description : '',
      format: model.format,
    },
    mode: 'onChange',
  });

  const onSubmit = useCallback<SubmitHandler<LoRAConfig>>(
    (values) => {
      const responseBody = {
        key: model.key,
        body: values,
      };

      updateModel(responseBody)
        .unwrap()
        .then((payload) => {
          reset(payload as LoRAConfig, { keepDefaultValues: true });
          dispatch(
            addToast(
              makeToast({
                title: t('modelManager.modelUpdated'),
                status: 'success',
              })
            )
          );
        })
        .catch((_) => {
          reset();
          dispatch(
            addToast(
              makeToast({
                title: t('modelManager.modelUpdateFailed'),
                status: 'error',
              })
            )
          );
        });
    },
    [dispatch, model.key, reset, t, updateModel]
  );

  return (
    <Flex flexDirection="column" rowGap={4} width="100%">
      <Flex flexDirection="column">
        <Text fontSize="lg" fontWeight="bold">
          {model.name}
        </Text>
        <Text fontSize="sm" color="base.400">
          {MODEL_TYPE_MAP[model.base]} {t('modelManager.model')} ⋅ {LORA_MODEL_FORMAT_MAP[model.format]}{' '}
          {t('common.format')}
        </Text>
      </Flex>
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex flexDirection="column" overflowY="scroll" gap={4}>
          <FormControl isInvalid={Boolean(errors.name)}>
            <FormLabel>{t('modelManager.name')}</FormLabel>
            <Input
              {...register('name', {
                validate: (value) => value.trim().length > 3 || 'Must be at least 3 characters',
              })}
            />
            {errors.name?.message && <FormErrorMessage>{errors.name?.message}</FormErrorMessage>}
          </FormControl>
          <FormControl>
            <FormLabel>{t('modelManager.description')}</FormLabel>
            <Input {...register('description')} />
          </FormControl>
          <BaseModelSelect<LoRAConfig> control={control} name="base" />

          <FormControl isInvalid={Boolean(errors.path)}>
            <FormLabel>{t('modelManager.modelLocation')}</FormLabel>
            <Input
              {...register('path', {
                validate: (value) => value.trim().length > 0 || 'Must provide a path',
              })}
            />
            {errors.path?.message && <FormErrorMessage>{errors.path?.message}</FormErrorMessage>}
          </FormControl>
          <Button type="submit" isLoading={isLoading}>
            {t('modelManager.updateModel')}
          </Button>
        </Flex>
      </form>
    </Flex>
  );
};

export default memo(LoRAModelEdit);
