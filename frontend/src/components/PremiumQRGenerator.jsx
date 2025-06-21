import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { FaCrown, FaQrcode, FaPalette, FaUpload, FaDownload, FaCopy, FaShare } from "react-icons/fa";
import styles from "../styles/PremiumQRGenerator.module.css";

const PremiumQRGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState({
    qrData: "",
    color: "#00C8C8", // Default premium color
    logo: null,
    generatedUrl: "",
    loading: false,
    error: null,
    logoPreview: "",
    frameStyle: "square", // Premium-only feature
    gradient: false // Premium-only feature
  });

  // Verify premium status on mount
  useEffect(() => {
    const verifyPremiumStatus = async () => {
      const token = localStorage.getItem("authToken");
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!token || !user?.isPremium) {
        navigate("/payment", { 
          state: { 
            from: location.pathname,
            message: "Premium feature requires subscription"
          },
          replace: true
        });
      }
    };

    verifyPremiumStatus();
  }, [navigate, location]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|png|gif)/)) {
      setState(prev => ({ ...prev, error: "Only JPEG, PNG or GIF images are allowed" }));
      return;
    }

    // Validate file size (increased limit for premium)
    if (file.size > 5 * 1024 * 1024) {
      setState(prev => ({ ...prev, error: "File size must be less than 5MB" }));
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      logo: file,
      logoPreview: previewUrl,
      error: null
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!state.qrData.trim()) {
      setState(prev => ({ ...prev, error: "Please enter content for the QR code" }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const formData = new FormData();
    formData.append("data", state.qrData);
    formData.append("color", state.color);
    formData.append("frameStyle", state.frameStyle);
    formData.append("gradient", state.gradient);
    if (state.logo) formData.append("logo", state.logo);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/qrcode/premium/generate`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "multipart/form-data",
          }
        }
      );

      setState(prev => ({
        ...prev,
        generatedUrl: response.data.qrUrl,
        loading: false
      }));

    } catch (error) {
      console.error("Generation error:", error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || "Generation failed. Please try again.",
        loading: false
      }));
    }
  };

  const handleDownload = (format = 'png') => {
    if (!state.generatedUrl) return;
    
    const link = document.createElement("a");
    link.href = state.generatedUrl.replace('.png', `.${format}`);
    link.download = `PremiumQR_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Premium color palette options
  const premiumColors = [
    '#00C8C8', '#2563EB', '#7C3AED', '#DB2777', 
    '#10B981', '#F59E0B', '#EF4444', '#000000'
  ];

  return (
    <div className={styles.premiumContainer}>
      <div className={styles.premiumHeader}>
        <div className={styles.premiumBadge}>
          <FaCrown /> PREMIUM GENERATOR
        </div>
        <h1>Create Branded QR Codes</h1>
        <p>Leverage premium features to create professional QR codes</p>
      </div>

      <div className={styles.generatorGrid}>
        {/* Configuration Panel */}
        <div className={styles.configPanel}>
          <form onSubmit={handleGenerate}>
            <div className={styles.inputGroup}>
              <label>
                <FaQrcode /> QR Content *
              </label>
              <input
                type="text"
                value={state.qrData}
                onChange={(e) => setState(prev => ({ ...prev, qrData: e.target.value }))}
                placeholder="https://yourdomain.com"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>
                <FaPalette /> Color Scheme
              </label>
              <div className={styles.colorPalette}>
                {premiumColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    style={{ backgroundColor: color }}
                    className={state.color === color ? styles.activeColor : ''}
                    onClick={() => setState(prev => ({ ...prev, color }))}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <input
                type="color"
                value={state.color}
                onChange={(e) => setState(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>
                <FaUpload /> Logo Upload
              </label>
              <div className={styles.uploadArea}>
                {state.logoPreview ? (
                  <div className={styles.logoPreview}>
                    <img src={state.logoPreview} alt="Logo preview" />
                    <button 
                      type="button" 
                      onClick={() => setState(prev => ({ ...prev, logo: null, logoPreview: "" }))}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      Click to upload logo (5MB max)
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className={styles.premiumOptions}>
              <label>
                <input
                  type="checkbox"
                  checked={state.gradient}
                  onChange={(e) => setState(prev => ({ ...prev, gradient: e.target.checked }))}
                />
                Gradient Effect
              </label>

              <div className={styles.frameOptions}>
                <label>Frame Style:</label>
                <select
                  value={state.frameStyle}
                  onChange={(e) => setState(prev => ({ ...prev, frameStyle: e.target.value }))}
                >
                  <option value="square">Square</option>
                  <option value="rounded">Rounded</option>
                  <option value="circle">Circular</option>
                  <option value="dot">Dot Pattern</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={state.loading}
              className={styles.generateButton}
            >
              {state.loading ? 'Generating...' : 'Generate Premium QR Code'}
            </button>
          </form>
        </div>

        {/* Preview Panel */}
        <div className={styles.previewPanel}>
          <div className={styles.qrPreview}>
            {state.generatedUrl ? (
              <img src={state.generatedUrl} alt="Generated QR Code" />
            ) : (
              <QRCodeSVG
                value={state.qrData || " "}
                size={300}
                level="H"
                bgColor={state.color}
                fgColor="#ffffff"
                includeMargin={true}
              />
            )}
          </div>

          {state.generatedUrl && (
            <div className={styles.downloadOptions}>
              <h3>Download Options:</h3>
              <div className={styles.downloadButtons}>
                <button onClick={() => handleDownload('png')}>
                  <FaDownload /> PNG
                </button>
                <button onClick={() => handleDownload('svg')}>
                  <FaDownload /> SVG
                </button>
                <button onClick={() => handleDownload('pdf')}>
                  <FaDownload /> PDF
                </button>
              </div>
              <div className={styles.shareOptions}>
                <button onClick={() => navigator.clipboard.writeText(state.generatedUrl)}>
                  <FaCopy /> Copy Link
                </button>
                <button onClick={() => navigator.share({ url: state.generatedUrl })}>
                  <FaShare /> Share
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {state.error && (
        <div className={styles.errorMessage}>
          {state.error}
        </div>
      )}
    </div>
  );
};

export default PremiumQRGenerator;