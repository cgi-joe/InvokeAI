import {
  Box,
  ChakraProps,
  Flex,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tooltip,
  VisuallyHidden,
} from '@chakra-ui/react';
import { RootState } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { setIsLightboxOpen } from 'features/lightbox/store/lightboxSlice';
import { InvokeTabName } from 'features/ui/store/tabMap';
import { setActiveTab, togglePanels } from 'features/ui/store/uiSlice';
import {
  memo,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { MdDeviceHub, MdGridOn } from 'react-icons/md';
import { GoTextSize } from 'react-icons/go';
import { activeTabIndexSelector } from '../store/uiSelectors';
import UnifiedCanvasWorkarea from 'features/ui/components/tabs/UnifiedCanvas/UnifiedCanvasWorkarea';
import { useTranslation } from 'react-i18next';
import { ResourceKey } from 'i18next';
import { requestCanvasRescale } from 'features/canvas/store/thunks/requestCanvasScale';
import NodeEditor from 'features/nodes/components/NodeEditor';
import GenerateWorkspace from './tabs/text/GenerateWorkspace';
import { createSelector } from '@reduxjs/toolkit';
import { BsLightningChargeFill } from 'react-icons/bs';
import { configSelector } from 'features/system/store/configSelectors';
import { isEqual } from 'lodash-es';
import AnimatedImageToImagePanel from 'features/parameters/components/AnimatedImageToImagePanel';
import Scrollable from './common/Scrollable';
import TextTabParameters from './tabs/text/TextTabParameters';
import PinParametersPanelButton from './PinParametersPanelButton';
import ParametersSlide from './common/ParametersSlide';
import ImageGalleryPanel from 'features/gallery/components/ImageGalleryPanel';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ImageGalleryContent from 'features/gallery/components/ImageGalleryContent';
import TextTabMain from './tabs/text/TextTabMain';
import ParametersPanel from './ParametersPanel';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import TextTab from './tabs/text/TextTab';
import UnifiedCanvasTab from './tabs/UnifiedCanvas/UnifiedCanvasTab';
import NodesTab from './tabs/Nodes/NodesTab';
import { FaImage } from 'react-icons/fa';
import ResizeHandle from './tabs/ResizeHandle';

export interface InvokeTabInfo {
  id: InvokeTabName;
  icon: ReactNode;
  content: ReactNode;
}

const tabs: InvokeTabInfo[] = [
  {
    id: 'text',
    icon: <Icon as={GoTextSize} sx={{ boxSize: 5 }} />,
    content: <TextTab />,
  },
  {
    id: 'image',
    icon: <Icon as={FaImage} sx={{ boxSize: 5 }} />,
    content: <TextTab />,
  },
  {
    id: 'unifiedCanvas',
    icon: <Icon as={MdGridOn} sx={{ boxSize: 6 }} />,
    content: <UnifiedCanvasTab />,
  },
  {
    id: 'nodes',
    icon: <Icon as={MdDeviceHub} sx={{ boxSize: 6 }} />,
    content: <NodesTab />,
  },
];

const enabledTabsSelector = createSelector(
  configSelector,
  (config) => {
    const { disabledTabs } = config;

    return tabs.filter((tab) => !disabledTabs.includes(tab.id));
  },
  {
    memoizeOptions: { resultEqualityCheck: isEqual },
  }
);

const InvokeTabs = () => {
  const activeTab = useAppSelector(activeTabIndexSelector);
  const enabledTabs = useAppSelector(enabledTabsSelector);
  const isLightBoxOpen = useAppSelector(
    (state: RootState) => state.lightbox.isLightboxOpen
  );

  const {
    shouldPinGallery,
    shouldPinParametersPanel,
    shouldShowGallery,
    shouldShowParametersPanel,
  } = useAppSelector((state: RootState) => state.ui);

  const { t } = useTranslation();

  const dispatch = useAppDispatch();

  useHotkeys('1', () => {
    dispatch(setActiveTab('text'));
  });

  useHotkeys('2', () => {
    dispatch(setActiveTab('image'));
  });

  useHotkeys('3', () => {
    dispatch(setActiveTab('unifiedCanvas'));
  });

  useHotkeys('4', () => {
    dispatch(setActiveTab('nodes'));
  });

  // Lightbox Hotkey
  useHotkeys(
    'z',
    () => {
      dispatch(setIsLightboxOpen(!isLightBoxOpen));
    },
    [isLightBoxOpen]
  );

  useHotkeys(
    'f',
    () => {
      dispatch(togglePanels());
      (shouldPinGallery || shouldPinParametersPanel) &&
        dispatch(requestCanvasRescale());
    },
    [shouldPinGallery, shouldPinParametersPanel]
  );

  const tabs = useMemo(
    () =>
      enabledTabs.map((tab) => (
        <Tooltip
          key={tab.id}
          hasArrow
          label={String(t(`common.${tab.id}` as ResourceKey))}
          placement="end"
        >
          <Tab>
            <VisuallyHidden>
              {String(t(`common.${tab.id}` as ResourceKey))}
            </VisuallyHidden>
            {tab.icon}
          </Tab>
        </Tooltip>
      )),
    [t, enabledTabs]
  );

  const tabPanels = useMemo(
    () =>
      enabledTabs.map((tab) => <TabPanel key={tab.id}>{tab.content}</TabPanel>),
    [enabledTabs]
  );

  return (
    <Tabs
      defaultIndex={activeTab}
      index={activeTab}
      onChange={(index: number) => {
        dispatch(setActiveTab(index));
      }}
      flexGrow={1}
      flexDir={{ base: 'column', xl: 'row' }}
      gap={{ base: 4 }}
      isLazy
    >
      <TabList
        pt={2}
        gap={4}
        flexDir={{ base: 'row', xl: 'column' }}
        justifyContent={{ base: 'center', xl: 'start' }}
      >
        {tabs}
      </TabList>
      <PanelGroup
        autoSaveId="app"
        direction="horizontal"
        style={{ height: '100%', width: '100%' }}
      >
        <Panel id="tabContent">
          <TabPanels style={{ height: '100%', width: '100%' }}>
            {tabPanels}
          </TabPanels>
        </Panel>
        {shouldPinGallery && shouldShowGallery && (
          <>
            <ResizeHandle />
            <Panel id="gallery" order={3} defaultSize={10} minSize={10}>
              <ImageGalleryContent />
            </Panel>
          </>
        )}
      </PanelGroup>
    </Tabs>
  );
};

export default memo(InvokeTabs);
