import { useState, useRef, useEffect } from "react";
import * as mpHands from "@mediapipe/hands";
import * as drawingUtils from "@mediapipe/drawing_utils";
import * as cameraUtils from "@mediapipe/camera_utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, VideoOff, SwitchCamera, Hand, Globe, Volume2, CheckCircle, Languages } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { autoCorrect } from "@/lib/grammar";
import { autoTranslate } from "@/lib/translate";
import { speakText, detectLanguage, isSpeaking, stopSpeaking } from "@/lib/speech";

interface HandData {
  handedness: string;
  landmarks: Array<{ x: number; y: number; z: number }>;
}

type HandsType = InstanceType<typeof mpHands.Hands>;

const Index = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentCamera, setCurrentCamera] = useState<"user" | "environment">("user");
  const [cameraStatus, setCameraStatus] = useState("Camera: Off");
  const [letter, setLetter] = useState("-");
  const [word, setWord] = useState("");
  const [sentence, setSentence] = useState("");
  const [hasDualCamera, setHasDualCamera] = useState(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);
  const [isHindi, setIsHindi] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [isCorrectingGrammar, setIsCorrectingGrammar] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const handsRef = useRef<HandsType | null>(null);
  const cameraRef = useRef<InstanceType<typeof cameraUtils.Camera> | null>(null);

  const isMobile = useIsMobile();

  useEffect(() => {
    checkCameraAvailability();
    return () => { void stopRecognition(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkCameraAvailability = async () => {
    try {
      // Request permission first to get accurate device labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => stream.getTracks().forEach(track => track.stop()))
        .catch(() => {});
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      console.log('Available video devices:', videoDevices.length, videoDevices);
      setHasDualCamera(videoDevices.length > 1);
    } catch (e) {
      console.warn("Failed to enumerate devices", e);
      setHasDualCamera(false);
    }
  };

  const onResults = (results: mpHands.Results) => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) { console.warn('Canvas context missing'); return; }

    if (!results.image) {
      console.warn('onResults called without results.image');
      return;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    
    // Flip horizontally to show non-mirrored view
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, w, h);
    
    // Reset transform for drawing landmarks
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (results.multiHandLandmarks && results.multiHandedness) {
      const handsData: HandData[] = [];
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const originalHandedness = results.multiHandedness?.[i]?.label || "";
        
        // Flip handedness label ONLY for display since we're flipping the image
        const displayHandedness = originalHandedness === "Right" ? "Left" : "Right";
        
        // Flip landmark coordinates to match the flipped image (for display only)
        const flippedLandmarks = landmarks.map(lm => ({ ...lm, x: 1 - lm.x }));
        
        // Draw with flipped labels and coordinates
        drawingUtils.drawConnectors(ctx, flippedLandmarks, mpHands.HAND_CONNECTIONS, { color: displayHandedness === "Right" ? "#6366f1" : "#a855f7", lineWidth: 3 });
        drawingUtils.drawLandmarks(ctx, flippedLandmarks, { color: displayHandedness === "Right" ? "#4f46e5" : "#9333ea", lineWidth: 1, radius: 3 });
        
        // Send FLIPPED data to backend to match training data (model was trained on mirrored camera)
        handsData.push({ 
          handedness: displayHandedness,  // Use flipped label
          landmarks: flippedLandmarks.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z }))  // Use flipped coordinates
        });
      }
      if (handsData.length > 0) safeSend({ type: "landmarks", data: handsData });
    }

    ctx.restore();
  };

  const initializeMediaPipe = () => {
    if (handsRef.current) {
      try { handsRef.current.onResults(onResults); } catch (e) { console.warn('rebind failed', e); }
      return;
    }
    const hands = new mpHands.Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
    hands.onResults(onResults);
    handsRef.current = hands;
  };

  const getStreamWithFallback = async (facing: "user" | "environment") => {
    try {
      // Try with facingMode first
      console.log('Requesting camera with facingMode:', facing);
      return await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
    } catch (e) {
      console.warn('facingMode failed, trying device selection fallback', e);
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        console.log('Available video inputs:', videoInputs);
        
        if (videoInputs.length === 0) {
          throw new Error('No video input devices found');
        }
        
        // Try to pick the right camera based on facing mode
        let deviceId = videoInputs[0].deviceId;
        if (videoInputs.length > 1) {
          // Try to find the appropriate camera
          const targetDevice = videoInputs.find(d => {
            const label = d.label.toLowerCase();
            if (facing === 'user') {
              return label.includes('front') || label.includes('user');
            } else {
              return label.includes('back') || label.includes('rear') || label.includes('environment');
            }
          });
          if (targetDevice) {
            deviceId = targetDevice.deviceId;
            console.log('Selected camera:', targetDevice.label);
          }
        }
        
        return await navigator.mediaDevices.getUserMedia({ 
          video: { 
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: false 
        });
      } catch (e2) {
        console.error('All camera fallbacks failed', e2);
        throw e2;
      }
    }
  };

  const safeSend = (payload: any) => {
    const ws = wsRef.current; if (!ws || ws.readyState !== WebSocket.OPEN) return false; try { ws.send(JSON.stringify(payload)); return true; } catch (e) { console.warn('ws send failed', e); return false; }
  };

  const startRecognition = async (clearPrevious = true): Promise<boolean> => {
    try {
      if (!videoRef.current) return false;
  if (clearPrevious) { setLetter('-'); setWord(''); setSentence(''); setRestartError(null); setIsHindi(false); if (canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); if (ctx) { ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvasRef.current.width, canvasRef.current.height); } } }

      try {
        const ws = new WebSocket('wss://marc-nondisparate-nondetractively.ngrok-free.dev/ws');
        ws.onmessage = (ev) => { 
          try { 
            const data = JSON.parse((ev as MessageEvent).data); 
            if (data?.type === 'prediction') { 
              const rawLetter = data.data?.letter || '-';
              const rawWord = data.data?.word || '';
              const rawSentence = data.data?.sentence || '';
              
              // Use raw data directly from backend without any corrections
              setLetter(rawLetter); 
              setWord(rawWord); 
              setSentence(rawSentence); 
            } 
          } catch (e) { 
            console.warn('invalid ws', e); 
          } 
        };
        ws.onopen = () => toast.success('Connected to recognition server');
        ws.onerror = () => toast.error('Recognition server connection failed (will continue locally)');
        wsRef.current = ws;
      } catch (e) { console.warn('ws create failed', e); }

      initializeMediaPipe();
      const stream = await getStreamWithFallback(currentCamera);
      try {
        if (videoRef.current) {
          try { videoRef.current.muted = true; } catch (e) {}
          // attach stream and play
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          // wait for video to be playing before sizing canvas
          try {
            const vid = videoRef.current;
            if (vid) {
              if (vid.readyState < 3) {
                // wait for playing or timeout
                await new Promise<void>((resolve) => {
                  let called = false;
                  const onPlaying = () => { if (called) return; called = true; vid.removeEventListener('playing', onPlaying); resolve(); };
                  vid.addEventListener('playing', onPlaying);
                  setTimeout(() => { if (called) return; called = true; try { vid.removeEventListener('playing', onPlaying); } catch (e) {} resolve(); }, 1200);
                });
              }

              try {
                if (canvasRef.current && vid.videoWidth && vid.videoHeight) {
                  canvasRef.current.width = vid.videoWidth;
                  canvasRef.current.height = vid.videoHeight;
                  console.debug('Canvas resized to', vid.videoWidth, vid.videoHeight);
                }
              } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }
        }
      } catch (e) { try { stream.getTracks().forEach((t) => t.stop()); } catch (e2) {} toast.error('Failed to start video playback. Check camera permissions.'); return false; }
      if (!handsRef.current) { try { stream.getTracks().forEach((t) => t.stop()); } catch (e) {} toast.error('MediaPipe not ready'); return false; }

      try { cameraRef.current = new cameraUtils.Camera(videoRef.current as HTMLVideoElement, { onFrame: async () => { if (handsRef.current && videoRef.current) { try { await handsRef.current.send({ image: videoRef.current }); } catch (e) { console.warn('hands send failed', e); } } }, width: 1280, height: 720 }); await cameraRef.current.start(); }
      catch (e) { try { (stream as MediaStream).getTracks().forEach((t) => t.stop()); } catch (e2) {} toast.error('Failed to start camera helper'); return false; }

      setIsRunning(true); setCameraStatus(`Camera: ${currentCamera === 'user' ? 'Front' : 'Back'}`); toast.success('Recognition started'); return true;
    } catch (e) { console.error('startRecognition error', e); toast.error('Failed to start recognition. Check camera permissions and backend connection.'); return false; }
  };

  const startRecognitionWithRetry = async (clearPrevious = true) => {
    const ok = await startRecognition(clearPrevious); if (ok) return true;
    console.warn('startRecognition failed, retrying with fresh hands');
    try { if (handsRef.current) { try { (handsRef.current as any).close?.(); } catch (e) {} handsRef.current = null; } initializeMediaPipe(); await new Promise((r) => setTimeout(r, 150)); const retryOk = await startRecognition(clearPrevious); if (retryOk) { toast.success('Recovery: camera restarted'); return true; } } catch (e) { console.error('recovery failed', e); }
    toast.error('Failed to start camera after recovery attempt'); return false;
  };

  const stopRecognition = async () => {
    try {
      // Stop the MediaPipe camera helper if running
      if (cameraRef.current) {
        try {
          // stop may be async in some implementations
          await (cameraRef.current as any).stop?.();
        } catch (e) {
          try { cameraRef.current?.stop(); } catch (e) {}
        }
        cameraRef.current = null;
      }

      // Pause video element and remove its source
      try {
        if (videoRef.current) {
          try { videoRef.current.pause(); } catch (e) {}
          try { if (videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} });
          } } catch (e) {}
          try { videoRef.current.srcObject = null; } catch (e) {}
          try { videoRef.current.removeAttribute('src'); videoRef.current.removeAttribute('srcObject'); } catch (e) {}
        }
      } catch (e) {}

      // ensure video element is fully reset (load will reset internal state)
      try { if (videoRef.current) { try { videoRef.current.load(); } catch (e) {} } } catch (e) {}

      // force React to remount the video element so the browser releases hardware
      try { setVideoKey((k) => k + 1); } catch (e) {}

      // Close MediaPipe hands instance if present and clear reference so a fresh one is created on next start
      try {
        if (handsRef.current) {
          try { (handsRef.current as any).close?.(); } catch (e) {}
          handsRef.current = null;
        }
      } catch (e) {}

      // Clear canvas (reset transform and dimensions to defaults)
      try {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.setTransform(1,0,0,1,0,0);
            ctx.clearRect(0,0,canvasRef.current.width, canvasRef.current.height);
          }
          try { canvasRef.current.width = 1280; canvasRef.current.height = 720; } catch (e) {}
        }
      } catch (e) {}

      // Clean up WebSocket - wait for final sentence before closing
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Send stop signal and wait for final prediction
          try { 
            wsRef.current.send(JSON.stringify({ type: 'stop' })); 
            
            // Wait for final sentence update (give server time to send final prediction)
            await new Promise<void>((resolve) => {
              let resolved = false;
              const timeout = setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  resolve();
                }
              }, 500); // Wait up to 500ms for final sentence
              
              // Listen for final message
              if (wsRef.current) {
                const originalOnMessage = wsRef.current.onmessage;
                wsRef.current.onmessage = (ev) => {
                  // Call original handler to update UI
                  if (originalOnMessage) originalOnMessage.call(wsRef.current, ev);
                  // Then resolve after a small delay to ensure state updates
                  if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    setTimeout(resolve, 100);
                  }
                };
              }
            });
          } catch (e) { 
            console.warn('Error waiting for final sentence', e); 
          }
          
          // Now close the connection
          try { if (wsRef.current) { wsRef.current.onmessage = null; wsRef.current.onopen = null; wsRef.current.onerror = null; } } catch (e) {}
          try { if (wsRef.current) wsRef.current.close(); } catch (e) {}
        }
      } catch (e) {
        console.warn('WebSocket cleanup error', e);
      }
      wsRef.current = null;
    } catch (e) {
      console.warn('stopRecognition error', e);
    } finally {
      setIsRunning(false);
      setCameraStatus('Camera: Stopped');
      toast.info('Recognition stopped');
    }
  };

  // Stop then start a fresh recognition session. Ensures complete cleanup before restarting.
  const restartRecognition = async () => {
    if (isSwitchingCamera) return;
    setIsSwitchingCamera(true);
    toast.info('Restarting camera...');
    try {
      await stopRecognition();
      // small delay to ensure hardware is released across platforms
      await new Promise((r) => setTimeout(r, 150));
      const ok = await startRecognitionWithRetry(true);
      if (ok) {
        toast.success('Camera restarted');
        setRestartError(null);
      } else {
        toast.error('Restart failed');
      }
    } catch (e) {
      console.error('restartRecognition failed', e);
      toast.error('Restart failed');
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  const translateSentence = async () => {
    const text = sentence || word || (letter === '-' ? '' : letter);
    if (!text || text.trim().length === 0) {
      toast.info('No text to translate');
      return;
    }

    setIsTranslating(true);
    const targetLang = isHindi ? 'English' : 'Hindi';
    toast.info(`Translating to ${targetLang}...`);
    
    try {
      const result = await autoTranslate(text, isHindi);
      
      setSentence(result.translatedText);
      
      // Toggle the language state to match the translated text
      setIsHindi(!isHindi);
      
      const serviceName = result.service === 'google' ? 'Google Translate' : 'MyMemory';
      toast.success(`Translated to ${targetLang}! (via ${serviceName})`);
      
      console.log('Translation:');
      console.log('Original:', result.originalText);
      console.log('Translated:', result.translatedText);
      console.log('Service:', serviceName);
    } catch (error) {
      console.error('Translation error details:', error);
      toast.error('Translation failed. Check internet connection and try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const speakCurrent = async () => {
    // Get text to speak from sentence (priority), word, or letter
    const text = sentence || word || (letter === '-' ? '' : letter);
    
    if (!text || text.trim().length === 0) {
      toast.info('No text to speak');
      return;
    }
    
    // Stop any current speech
    if (isSpeaking()) {
      stopSpeaking();
      setIsSpeakingNow(false);
      toast.info('Speech stopped');
      return;
    }
    
    setIsSpeakingNow(true);
    
    // Use current language mode (isHindi state) instead of auto-detection
    // This ensures numbers are spoken in the correct language
    const language: 'en-US' | 'hi-IN' = isHindi ? 'hi-IN' : 'en-US';
    const langName = isHindi ? 'Hindi' : 'English';
    
    toast.info(`Speaking in ${langName}...`);
    console.log('Speaking:', { text, language, isHindi });
    
    try {
      // Use Web Speech API
      const result = await speakText(text, language);
      
      if (result.success) {
        toast.success(`✅ Spoken in ${langName}`);
        console.log('Speech completed:', result);
      } else {
        toast.error(`Speech failed: ${result.message}`);
        console.error('Speech error:', result);
      }
    } catch (error) {
      console.error('Speech error:', error);
      toast.error('Speech synthesis failed');
    } finally {
      setIsSpeakingNow(false);
    }
  };

  const fixGrammar = async () => {
    const text = sentence || word || (letter === '-' ? '' : letter);
    if (!text || text.trim().length === 0) {
      toast.info('No text to correct');
      return;
    }

    setIsCorrectingGrammar(true);
    toast.info('Checking grammar...');
    
    try {
      const corrected = await autoCorrect(text, isHindi ? 'hi-IN' : 'en-US');
      
      if (corrected === text) {
        toast.success('No corrections needed!');
      } else {
        setSentence(corrected);
        toast.success('Grammar corrected!');
        console.log('Original:', text);
        console.log('Corrected:', corrected);
      }
    } catch (error) {
      console.error('Grammar correction error details:', error);
      toast.error('Grammar correction failed. Check internet connection and try again.');
    } finally {
      setIsCorrectingGrammar(false);
    }
  };

  const toggleCamera = async () => {
    // Allow switching only when camera is running
    if (!isRunning) {
      const newCamera = currentCamera === 'user' ? 'environment' : 'user';
      setCurrentCamera(newCamera);
      toast.info(`Camera will switch to ${newCamera === 'user' ? 'Front' : 'Back'} when you start`);
      return;
    }

    // If running, we need to restart with the new camera
    const newCamera = currentCamera === 'user' ? 'environment' : 'user';
    setCurrentCamera(newCamera);
    setIsSwitchingCamera(true);
    toast.info(`Switching to ${newCamera === 'user' ? 'Front' : 'Back'} camera...`);
    
    try {
      await stopRecognition();
      await new Promise((r) => setTimeout(r, 300));
      const ok = await startRecognitionWithRetry(false);
      if (ok) {
        toast.success(`Switched to ${newCamera === 'user' ? 'Front' : 'Back'} camera`);
        setRestartError(null);
      } else {
        toast.error('Failed to switch camera');
        setRestartError('Switch failed');
      }
    } catch (e) {
      console.error('toggleCamera error', e);
      toast.error('Camera switch failed');
      setRestartError('Switch failed');
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  return (
  <div className="min-h-screen bg-background py-2 sm:py-8 overflow-x-hidden">
      <div className="w-full max-w-[100vw] sm:max-w-7xl mx-auto space-y-3 sm:space-y-6 px-3 sm:px-6">
        <header className="text-center space-y-1 sm:space-y-3">
          <div className="flex items-center justify-center gap-1.5 sm:gap-3">
            <Hand className="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
            <h1 className="text-lg sm:text-3xl md:text-4xl font-bold text-foreground">ISL Recognition</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto px-1">Real-time Indian Sign Language translation</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-3 sm:gap-6 w-full">
          <div className="lg:col-span-2 space-y-2 sm:space-y-4 w-full min-w-0">
            <Card className="relative overflow-hidden shadow-medium bg-gradient-card w-full">
              <div className="aspect-video relative bg-muted h-[45vh] sm:h-[50vh] md:h-auto w-full">
                <video key={videoKey} ref={videoRef} className="absolute inset-0 w-full h-full object-cover hidden" playsInline />
                <canvas ref={canvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full object-contain max-w-full" />

                {isSwitchingCamera && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
                    <div className="px-4 py-2 rounded-md bg-white/10 text-white backdrop-blur-sm flex items-center gap-3">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
                      <div>Switching camera...</div>
                      {restartError && <button onClick={async () => { await restartRecognition(); }} className="ml-3 px-2 py-1 rounded bg-red-600 text-white text-sm">Retry</button>}
                    </div>
                  </div>
                )}

                {!isRunning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
                    <div className="text-center space-y-3">
                      <VideoOff className="w-16 h-16 mx-auto text-muted-foreground" />
                      <p className="text-lg font-medium text-muted-foreground">Camera is off</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Flip camera button above canvas for dual-camera devices */}
            {hasDualCamera && isMobile && (
              <div className="flex justify-end -mt-1 mb-1">
                <button onClick={toggleCamera} className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center" title="Flip Camera" aria-label="Flip Camera">
                  <SwitchCamera className="w-4 h-4 text-primary" />
                </button>
              </div>
            )}

            {/* Controls: Start/Stop with Translate & Speak side-by-side on desktop */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
                {/* Main action */}
                <div className="w-full sm:w-auto">
                    {!isRunning ? (
                    <Button onClick={() => startRecognitionWithRetry(true)} size="lg" className="w-full gap-2 bg-gradient-primary hover:opacity-90 transition-opacity text-base sm:text-lg py-2.5"><Video className="w-5 h-5 sm:w-6 sm:h-6" />Start Recognition</Button>
                  ) : (
                    <Button onClick={stopRecognition} size="lg" variant="destructive" className="w-full gap-2 text-base sm:text-lg py-2.5"><VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />Stop</Button>
                  )}
                </div>

                {/* Desktop-only small actions placed next to Start */}
                <div className="hidden sm:flex items-center gap-2">
                  {hasDualCamera && (
                    <Button onClick={toggleCamera} size="sm" variant="secondary" disabled={isRunning} aria-disabled={isRunning} className={`gap-2 ${isRunning ? 'opacity-50 pointer-events-none' : ''}`}><SwitchCamera className="w-6 h-6" /></Button>
                  )}
                  <Button onClick={translateSentence} disabled={isRunning || isTranslating} aria-disabled={isRunning || isTranslating} size="lg" className={`gap-2 bg-gradient-primary hover:opacity-90 transition-opacity px-4 py-2 min-w-[150px] text-lg ${(isRunning || isTranslating) ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Languages className="w-6 h-6" />
                    <span className="ml-2">{isTranslating ? 'Translating...' : `Translate`}</span>
                  </Button>
                  <Button onClick={speakCurrent} disabled={isRunning || isSpeakingNow} aria-disabled={isRunning || isSpeakingNow} size="lg" className={`gap-2 bg-gradient-primary hover:opacity-90 transition-opacity px-4 py-2 min-w-[150px] text-lg ${(isRunning || isSpeakingNow) ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Volume2 className={`w-6 h-6 ${isSpeakingNow ? 'animate-pulse' : ''}`} />
                    <span className="ml-2">{isSpeakingNow ? 'Speaking...' : 'Speak'}</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center"><p className="text-xs sm:text-sm text-muted-foreground">{cameraStatus}</p></div>
          </div>

          {/* Recognition Output */}
          <div className="space-y-2 sm:space-y-4 w-full min-w-0">
            <Card className="p-3 sm:p-6 shadow-soft bg-gradient-card w-full">
              <h2 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 text-foreground">Last Letter</h2>
              <div className="text-4xl sm:text-6xl font-bold text-center text-primary">{letter}</div>
            </Card>

            <Card className="p-3 sm:p-6 shadow-soft bg-gradient-card w-full">
              <h2 className="text-sm sm:text-lg font-semibold mb-1.5 sm:mb-3 text-foreground">Current Word</h2>
              <div className="text-lg sm:text-2xl font-semibold text-center text-accent min-h-[1.5rem] sm:min-h-[2rem] break-all">{word || "-"}</div>
            </Card>

            <Card className="p-3 sm:p-6 shadow-soft bg-gradient-card w-full">
              <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                <h2 className="text-sm sm:text-lg font-semibold text-foreground">Full Sentence</h2>
                {sentence && sentence.trim().length > 0 && (
                  <Button 
                    onClick={fixGrammar} 
                    disabled={isCorrectingGrammar || isRunning}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {isCorrectingGrammar ? 'Checking...' : 'Fix Grammar'}
                  </Button>
                )}
              </div>
              <div className="text-sm sm:text-lg text-foreground min-h-[3rem] sm:min-h-[6rem] break-words">{sentence || "Start recognition to see results..."}</div>
            </Card>

            {/* Mobile Translate & Speak buttons - below Full Sentence */}
            {isMobile && (
              <div className="flex flex-row items-stretch justify-center gap-2 w-full">
                <button onClick={translateSentence} disabled={isRunning || isTranslating} aria-disabled={isRunning || isTranslating} className={`inline-flex items-center justify-center px-2.5 py-2.5 rounded-md bg-gradient-primary text-white flex-1 text-xs font-medium ${(isRunning || isTranslating) ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Languages className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{isTranslating ? 'Translating...' : 'Translate'}</span>
                </button>
                <button onClick={speakCurrent} disabled={isRunning || isSpeakingNow} aria-disabled={isRunning || isSpeakingNow} className={`inline-flex items-center justify-center px-2.5 py-2.5 rounded-md bg-gradient-primary text-white flex-1 text-xs font-medium ${(isRunning || isSpeakingNow) ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Volume2 className={`w-4 h-4 mr-1 flex-shrink-0 ${isSpeakingNow ? 'animate-pulse' : ''}`} />
                  <span className="truncate">{isSpeakingNow ? 'Speaking...' : 'Speak'}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
