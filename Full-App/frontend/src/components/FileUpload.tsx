import React from 'react';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    onFileRemove: () => void;
    isUploading: boolean;
    currentFile: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onFileRemove, isUploading, currentFile }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                onFileUpload(file);
            }
        }
    };

    return (
        <div className="file-upload-section">
            {currentFile ? (
                <div className="file-status">
                    <div className="file-info">
                        <svg className="pdf-icon" viewBox="0 0 24 24">
                            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
                        </svg>
                        <span className="filename">{currentFile}</span>
                        <button
                            className="remove-file"
                            onClick={onFileRemove}
                            title="Remove file"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ) : (
                <div className="file-upload-inline">
                    <input
                        type="file"
                        id="file-upload"
                        accept=".pdf"
                        onChange={handleChange}
                        disabled={isUploading}
                    />
                    <label htmlFor="file-upload" className="upload-button" title="Attach PDF">
                        <svg viewBox="0 0 24 24" className="attach-icon">
                            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
                        </svg>
                    </label>
                </div>
            )}
        </div>
    );
};

export default FileUpload; 