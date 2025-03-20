import clsx from 'clsx';
import { useState } from 'react';
import * as request from '../../utils/request';
import LoadingComponent from '../../components/Loading';
import { useLocation } from 'react-router-dom';

function TestPrompt() {
    const location = useLocation();
    const promptId = location.state.promptId;
    const [promptInfo, setPromptInfo] = useState<string>();
    const [imageData, setImageData] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const response = await request.post('/image/text-to-multiple-images', {
                prompt: promptInfo,
                promptId: promptId.id,
            });

            const base64Images = response.imageList;
            const imageSources = base64Images.map((base64Image: string) => `data:image/png;base64,${base64Image}`);

            setImageData(imageSources);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={clsx('container', 'd-flex', 'flex-column', 'h-100', 'w-100')}>
            <div className={clsx('prompt-body')}>
                <div className={clsx('d-flex', 'flex-wrap', 'justify-content-start')}>
                    {imageData.length > 0 &&
                        imageData.map((image, index) => (
                            <img
                                key={index}
                                src={image}
                                alt={`image-${index}`}
                                className={clsx('rounded', 'm-2', 'img-thumbnail')}
                            />
                        ))}
                </div>
                {isLoading && <LoadingComponent />}
            </div>
            <div className={clsx('d-flex', 'flex-column', 'align-items-end')}>
                <div className={clsx('form-floating', 'w-100')}>
                    <textarea
                        className={clsx('form-control')}
                        placeholder="Leave a comment here"
                        id="floatingTextarea2"
                        style={{ height: '100px' }}
                        value={promptInfo}
                        onChange={(e) => setPromptInfo(e.target.value)}
                    ></textarea>
                    <label htmlFor="floatingTextarea2">Prompt Here</label>
                </div>
                <button
                    className={clsx('btn', 'btn-primary', 'float-right', 'mt-2')}
                    disabled={isLoading || !promptInfo}
                    onClick={handleSubmit}
                >
                    Submit
                </button>
            </div>
        </div>
    );
}

export default TestPrompt;
