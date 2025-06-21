import { useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import styles from '../styles/QRCodeGenerator.module.css';

const QrGenerator = () => {
    const [qrData, setQrData] = useState('');
    const [qrImageUrl, setQrImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isTrialUser, setIsTrialUser] = useState(true); // Assuming this comes from user state

    const handleGenerateQR = async () => {
        if (!qrData) {
            setError('Please enter text to generate QR code');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const res = await axios.post(
                'http://localhost:5000/api/qrcode/generate',
                { data: qrData },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setQrImageUrl(res.data.qrImageUrl);
        } catch (error) {
            console.error('QR Code generation failed', error);
            setError('Failed to generate QR code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadQRCode = () => {
        const svg = document.getElementById('qrcode-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `QR_${qrData}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Generate QR Code</h2>
            
            <div className={styles.inputGroup}>
                <input
                    type="text"
                    value={qrData}
                    onChange={(e) => setQrData(e.target.value)}
                    placeholder="Enter URL or text"
                    className={styles.input}
                />
                <button 
                    onClick={handleGenerateQR}
                    className={styles.generateButton}
                    disabled={loading}
                >
                    {loading ? 'Generating...' : 'Generate QR Code'}
                </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {(qrImageUrl || qrData) && (
                <div className={styles.qrPreview}>
                    <h3 className={styles.subtitle}>Your QR Code</h3>
                    <div className={styles.qrWrapper}>
                        {qrImageUrl ? (
                            <img 
                                src={qrImageUrl} 
                                alt="Generated QR Code" 
                                className={styles.qrImage}
                            />
                        ) : (
                            <QRCodeSVG
                                id="qrcode-svg"
                                value={qrData} 
                                size={200}
                                level="H"
                                className={styles.qrCode}
                            />
                        )}
                    </div>
                    
                    <div className={styles.buttonGroup}>
                        <button 
                            onClick={downloadQRCode}
                            className={styles.downloadButton}
                        >
                            Download QR Code
                        </button>
                        {qrImageUrl && (
                            <button
                                className={styles.copyButton}
                                onClick={() => navigator.clipboard.writeText(qrImageUrl)}
                            >
                                Copy Link
                            </button>
                        )}
                    </div>

                    {/* Add this section for trial users */}
                    {isTrialUser && (
                        <div className={styles.trialNotice}>
                            <p>You're using the trial version. Upgrade for full features!</p>
                            <Link 
                                to="/signup" 
                                className={styles.upgradeButton}
                            >
                                Get Started with Full Version
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QrGenerator;