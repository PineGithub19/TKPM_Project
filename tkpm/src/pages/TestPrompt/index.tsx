import clsx from 'clsx';
import { useState } from 'react';
import * as request from '../../utils/request';

function TestPrompt() {
    const [promptInfo, setPromptInfo] = useState<string>('');
    const [imageData, setImageData] = useState<string>('');

    const handleSubmit = async () => {
        try {
            const response = await request.post('/image/text-to-image', {
                prompt: promptInfo,
            });

            const base64Image = response.image;
            const imageSrc = `data:image/png;base64,${base64Image}`;

            setImageData(imageSrc);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className={clsx('container', 'd-flex', 'flex-column', 'h-100', 'w-100')}>
            <div className={clsx('prompt-body')}>{imageData && <img src={imageData} alt="Prompt Image" />}</div>
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
                <button className={clsx('btn', 'btn-primary', 'float-right', 'mt-2')} onClick={handleSubmit}>
                    Submit
                </button>
            </div>
        </div>
    );
}

export default TestPrompt;
