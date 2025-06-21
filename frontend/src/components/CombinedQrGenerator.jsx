import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import styles from "../styles/CombinedQrGenerator.module.css";

const CombinedQRGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState({
    qrData: "",
    color: "#000000",
    logo: null,
    generatedUrl: "",
    loading: false,
    error: null,
    logoPreview: ""
  });

  // Authentication check and cleanup
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login", { 
        state: { from: location.pathname },
        replace: true 
      });
    }

    return () => {
      if (state.logoPreview) URL.revokeObjectURL(state.logoPreview);
    };
  }, [navigate, location, state.logoPreview]);

  // User data handling with error protection
  const getUserData = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return { role: "free" };
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { role: "free" };
    }
  };

  const user = getUserData();
  const isPremium = user.role === "premium";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setState(prev => ({ ...prev, error: "Only image files are allowed (JPEG, PNG)" }));
      return;
    }

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      setState(prev => ({ ...prev, error: "File size must be less than 2MB" }));
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

  const validateInput = (input) => {
    if (!input.trim()) {
      setState(prev => ({ ...prev, error: "Please enter content for the QR code" }));
      return false;
    }
    
    // URL validation warning
    try {
      new URL(input);
    } catch (_) {
      if (!confirm("The input doesn't look like a URL. Generate anyway?")) {
        return false;
      }
    }
    
    return true;
  };

  const handleGenerationError = (error) => {
    console.error("QR Generation Error:", error);

    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      navigate("/login", { 
        state: { 
          from: location.pathname,
          message: "Session expired. Please login again."
        },
        replace: true
      });
      return;
    }

    // Set appropriate error message
    const errorMessage = error.response?.data?.message ||
      error.message ||
      "QR code generation failed. Please try again.";

    setState(prev => ({
      ...prev,
      error: errorMessage,
      generatedUrl: ""
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    // Validate authentication
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // Validate input
    if (!validateInput(state.qrData)) return;

    // Prevent duplicate submissions
    if (state.loading) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Prepare form data
    const formData = new FormData();
    formData.append("data", state.qrData);
    
    if (isPremium) {
      formData.append("color", state.color);
      if (state.logo) formData.append("logo", state.logo);
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/qrcode/generate`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000
        }
      );

      setState(prev => ({
        ...prev,
        generatedUrl: response.data.qrUrl || response.data.qrImageUrl,
        loading: false,
        error: null
      }));

    } catch (error) {
      handleGenerationError(error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDownload = () => {
    if (!state.generatedUrl) return;
    
    const filename = `QR_${state.qrData.slice(0, 20).replace(/[^a-z0-9]/gi, '_')}.png`;
    const link = document.createElement("a");
    link.href = state.generatedUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!state.generatedUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check out this QR Code",
          text: "Scan this QR code",
          url: state.generatedUrl
        });
      } else {
        // Fallback for browsers without Web Share API
        await navigator.clipboard.writeText(state.generatedUrl);
        setState(prev => ({ ...prev, error: "Link copied to clipboard!" }));
        setTimeout(() => {
          setState(prev => ({ ...prev, error: null }));
        }, 2000);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Sharing failed:", error);
        setState(prev => ({ ...prev, error: "Sharing failed. Please try again." }));
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* QR Pattern Background Elements */}
        <div className={styles.qrPattern} style={{ top: "20%", left: "10%" }} />
        <div className={styles.qrPattern} style={{ bottom: "15%", right: "12%" }} />
        
        <header className={styles.header}>
          <h1 className={styles.title}>
            QR Code Generator
            {isPremium && <span className={styles.premiumBadge}>PRO</span>}
          </h1>
        </header>

        <form onSubmit={handleGenerate} className={styles.form} noValidate>
          <div className={styles.inputGroup}>
            <label htmlFor="qr-content" className={styles.label}>
              QR Code Content *
            </label>
            <input
              id="qr-content"
              type="text"
              placeholder="https://example.com or your text"
              value={state.qrData}
              onChange={(e) => setState(prev => ({ ...prev, qrData: e.target.value }))}
              className={styles.input}
              required
              disabled={state.loading}
            />
            <small className={styles.helpText}>
              Enter a valid URL or any text content
            </small>
          </div>

          {isPremium && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="qr-color" className={styles.label}>
                  QR Code Color
                  <span className={styles.premiumTag}>(Premium Feature)</span>
                </label>
                <input
                  id="qr-color"
                  type="color"
                  value={state.color}
                  onChange={(e) => setState(prev => ({ ...prev, color: e.target.value }))}
                  className={styles.colorInput}
                  disabled={state.loading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="qr-logo" className={styles.label}>
                  Upload Logo
                  <span className={styles.premiumTag}>(Premium Feature)</span>
                </label>
                <input
                  id="qr-logo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                  disabled={state.loading}
                />
                <small className={styles.helpText}>
                  Maximum file size: 2MB (PNG, JPG, GIF)
                </small>

                {state.logoPreview && (
                  <div className={styles.filePreview}>
                    <img 
                      src={state.logoPreview} 
                      alt="Logo preview" 
                      className={styles.logoPreview}
                    />
                    <button 
                      type="button" 
                      onClick={() => setState(prev => ({ ...prev, logo: null, logoPreview: "" }))}
                      className={styles.removeButton}
                      disabled={state.loading}
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <button 
            type="submit" 
            className={styles.button} 
            disabled={state.loading}
            aria-busy={state.loading}
          >
            {state.loading ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Generating QR Code...
              </>
            ) : (
              "Generate QR Code"
            )}
          </button>
        </form>

        {state.error && (
          <div className={`${styles.error} ${state.error.includes("copied") ? styles.success : ""}`}>
            {state.error}
          </div>
        )}

        <section className={styles.preview}>
          <h2 className={styles.subtitle}>
            {state.generatedUrl ? "Generated QR Code" : "Live Preview"}
          </h2>
          
          <div className={styles.qrContainer}>
            {state.generatedUrl ? (
              <img 
                src={state.generatedUrl} 
                alt="Generated QR Code" 
                className={styles.qrImage} 
              />
            ) : (
              <QRCodeSVG
                value={state.qrData || " "}
                size={200}
                level="H"
                bgColor={isPremium ? state.color : "#000000"}
                fgColor="#ffffff"
                className={styles.qrSVG}
              />
            )}
          </div>

          {state.generatedUrl && (
            <div className={styles.actions}>
              <button onClick={handleDownload} className={styles.actionButton}>
                Download
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(state.generatedUrl);
                  setState(prev => ({ ...prev, error: "Link copied to clipboard!" }));
                  setTimeout(() => setState(prev => ({ ...prev, error: null })), 2000);
                }}
                className={styles.actionButton}
              >
                Copy Link
              </button>
              <button onClick={handleShare} className={styles.actionButton}>
                Share
              </button>
            </div>
          )}
        </section>

        {!isPremium && (
          <aside className={styles.upgradeBanner}>
            <h3>Unlock Premium Features</h3>
            <ul className={styles.featureList}>
              <li>Custom QR Code Colors</li>
              <li>Brand Logo Integration</li>
              <li>Advanced Analytics</li>
              <li>Priority Support</li>
            </ul>
            <button 
              onClick={() => navigate("/upgrade")}
              className={styles.upgradeButton}
            >
              Upgrade to PRO
            </button>
          </aside>
        )}
      </div>
    </div>
  );
};

export default CombinedQRGenerator;