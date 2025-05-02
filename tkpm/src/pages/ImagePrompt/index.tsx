import { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import ImagesConfiguration, { ImageConfig } from './ImagePromptComponents/ImagesConfiguration';
import ImagesForVideo from './ImagePromptComponents/ImagesForVideo';

const { TabPane } = Tabs;

function ImagePrompt({
    promptId,
    scriptSegments = [],
    handleCheckedImagesListComplete,
    checkedImagesList,
}: {
    promptId?: string;
    scriptSegments?: string[];
    handleCheckedImagesListComplete?: (images: string[]) => void;
    checkedImagesList: string[];
}) {
    const [activeTab, setActiveTab] = useState<string>('1');
    const [config, setConfig] = useState<{
        imageConfig: ImageConfig;
        generationType: 'static' | 'motion';
        modelAIType: 'gemini' | 'stable_diffusion';
    }>({
        imageConfig: {
            steps: 10,
            width: 256,
            height: 256,
            cfg_scale: 7,
            seed: -1,
            sampler_name: 'Euler a',
            batch_size: 2,
            model: 'dreamshaper_8.safetensors',
            fps: 8,
            video_length: 16,
            loop_number: 0,
            latent_power: 1,
        },
        generationType: 'static',
        modelAIType: 'gemini',
    });

    const handleTabChange = (key: string) => {
        setActiveTab(key);
    };

    const handleConfigChange = (newConfig: {
        imageConfig: ImageConfig;
        generationType: 'static' | 'motion';
        modelAIType: 'gemini' | 'stable_diffusion';
    }) => {
        setConfig(newConfig);
    };

    useEffect(() => {
        console.log('CHECK THONG TIN TRONG ImagePrompt: ', {
            checkedImagesList,
            scriptSegments,
        });
    }, [checkedImagesList, scriptSegments]);

    return (
        <Tabs activeKey={activeTab} onChange={handleTabChange} className="custom-tabs">
            <TabPane tab="Cấu hình" key="1" className="custom-tab-pane">
                <ImagesConfiguration onConfigChange={handleConfigChange} />
            </TabPane>
            <TabPane tab="Tạo ảnh" key="2" className="custom-tab-pane">
                <ImagesForVideo
                    scriptSegments={scriptSegments}
                    promptId={promptId}
                    handleCheckedImagesListComplete={handleCheckedImagesListComplete}
                    imageConfig={config.imageConfig}
                    generationType={config.generationType}
                    modelAIType={config.modelAIType}
                    checkedImagesList={checkedImagesList}
                />
            </TabPane>
        </Tabs>
    );
}

export default ImagePrompt;
