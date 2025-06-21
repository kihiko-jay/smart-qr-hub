import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/myqrcodes.module.css';

const MyQrCodes = () => {
    const [qrCodes, setQrCodes] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [copySuccess, setCopySuccess] = useState(null);
    const navigate = useNavigate();

    const fetchQrCodes = useCallback(async () => {
        try {
            setRefreshing(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const res = await axios.get('http://localhost:5000/api/qrcode/myqrcodes', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setQrCodes(res.data);
        } catch (err) {
            console.error('Error fetching QR codes:', err);
        } finally {
            setRefreshing(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchQrCodes();
    }, [fetchQrCodes]);

    const downloadQrCode = (qrImageUrl, qrData) => {
        const link = document.createElement('a');
        link.href = qrImageUrl;
        link.download = `QR_Code_${qrData}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyQrLink = async (qrImageUrl) => {
        try {
            await navigator.clipboard.writeText(qrImageUrl);
            setCopySuccess(qrImageUrl);
            setTimeout(() => setCopySuccess(null), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const shareQrCode = (qrImageUrl) => {
        if (navigator.share) {
            navigator.share({
                title: 'QR Code',
                text: 'Check out this QR Code:',
                url: qrImageUrl
            });
        } else {
            // Fallback for desktop
            window.open(qrImageUrl, '_blank');
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.header}>
                <h1 className={styles.appTitle}>QrX</h1>
                <button 
                    onClick={fetchQrCodes} 
                    disabled={refreshing} 
                    className={styles.refreshButton}
                >
                    {refreshing ? '🌀 Refreshing...' : '🔄 Refresh Codes'}
                </button>
            </div>

            <div className={styles.glassEffect}>
                <h2 className={styles.welcomeText}>Your QR Code Library</h2>
                
                {qrCodes.length === 0 ? (
                    <p className={styles.message}>🌟 No QR codes found. Create your first one!</p>
                ) : (
                    <div className={styles.statsContainer}>
                        <div className={styles.statCard}>
                            <div className={styles.statTitle}>Total QR Codes</div>
                            <div className={styles.statValue}>{qrCodes.length}</div>
                        </div>
                    </div>
                )}

                <div className={styles.qrGrid}>
                    {qrCodes.map((qr) => (
                        <div key={qr._id} className={styles.glassCard}>
                            <div className={styles.qrMeta}>
                                <p className={styles.qrData}>{qr.qrData}</p>
                                <div className={styles.qrStats}>
                                    <span>Scans: {qr.scanCount || 0}</span>
                                    <span>{new Date(qr.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            
                            <img 
                                src={qr.qrImageUrl} 
                                alt="QR Code" 
                                className={styles.qrImage} 
                                onError={(e) => e.target.src = '/fallback-qr.png'}
                            />

                            <div className={styles.buttonGroup}>
                                <button
                                    onClick={() => downloadQrCode(qr.qrImageUrl, qr.qrData)}
                                    className={`${styles.button} ${styles.downloadButton}`}
                                >
                                    📥 Download
                                </button>
                                
                                <button
                                    onClick={() => shareQrCode(qr.qrImageUrl)}
                                    className={`${styles.button} ${styles.shareButton}`}
                                >
                                    🔗 Share
                                </button>
                                
                                <button
                                    onClick={() => copyQrLink(qr.qrImageUrl)}
                                    className={`${styles.button} ${styles.copyButton} ${
                                        copySuccess === qr.qrImageUrl ? styles.copySuccess : ''
                                    }`}
                                >
                                    📋 {copySuccess === qr.qrImageUrl ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyQrCodes;