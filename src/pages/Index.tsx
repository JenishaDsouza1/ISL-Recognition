import { useState, useRef, useEffect } from "react";
import * as mpHands from "@mediapipe/hands";
import * as drawingUtils from "@mediapipe/drawing_utils";
import * as cameraUtils from "@mediapipe/camera_utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, VideoOff, SwitchCamera, Hand } from "lucide-react";
import { toast } from "sonner";

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const handsRef = useRef<HandsType | null>(null);
  const cameraRef = useRef<InstanceType<typeof cameraUtils.Camera> | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    checkCameraAvailability();
    return () => {
      stopRecognition();
    };
  }, []);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setHasDualCamera(videoDevices.length > 1);
    } catch (error) {
      console.error("Error checking camera availability:", error);
    }
  };

  const initializeMediaPipe = () => {
    const hands = new mpHands.Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    hands.onResults(onResults);
    handsRef.current = hands;
  };

  const onResults = (results: mpHands.Results) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvasCtx = canvasRef.current.getContext("2d");
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiHandLandmarks && results.multiHandedness) {
      const handsData: HandData[] = [];

      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        // MediaPipe returns mirrored handedness for front camera
        // Flip the label to match user's actual hand
        let handedness = results.multiHandedness[i].label;
        
        // Swap left/right for front camera (user-facing)
        if (currentCamera === "user") {
          handedness = handedness === "Right" ? "Left" : "Right";
        }

        drawingUtils.drawConnectors(canvasCtx, landmarks, mpHands.HAND_CONNECTIONS, {
          color: handedness === "Right" ? "#6366f1" : "#a855f7",
          lineWidth: 3,
        });
        drawingUtils.drawLandmarks(canvasCtx, landmarks, {
          color: handedness === "Right" ? "#4f46e5" : "#9333ea",
          lineWidth: 1,
          radius: 3,
        });

        handsData.push({
          handedness,
          landmarks: landmarks.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z })),
        });
      }

      if (wsRef.current?.readyState === WebSocket.OPEN && handsData.length > 0) {
        wsRef.current.send(
          JSON.stringify({
            type: "landmarks",
            data: handsData,
          })
        );
      }
    }

    canvasCtx.restore();
  };

  const startRecognition = async () => {
    try {
      if (!videoRef.current) return;

      // Initialize WebSocket
      const ws = new WebSocket("ws://127.0.0.1:8000/ws");
      
      ws.onopen = () => {
        console.log("WebSocket connected");
        toast.success("Connected to recognition server");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "prediction") {
          setLetter(data.data.letter || "-");
          setWord(data.data.word || "");
          setSentence(data.data.sentence || "");
        }
      };

      ws.onerror = () => {
        toast.error("Failed to connect to server. Make sure backend is running on ws://127.0.0.1:8000/ws");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
      };

      wsRef.current = ws;

      // Initialize MediaPipe
      initializeMediaPipe();

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentCamera },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      if (handsRef.current && videoRef.current) {
        const camera = new cameraUtils.Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current && videoRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720,
        });
        camera.start();
        cameraRef.current = camera;
      }

      setIsRunning(true);
      setCameraStatus(`Camera: ${currentCamera === "user" ? "Front" : "Back"}`);
      toast.success("Recognition started");
    } catch (error) {
      console.error("Error starting recognition:", error);
      toast.error("Failed to start camera. Please check permissions.");
    }
  };

  const stopRecognition = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
      wsRef.current.close();
      wsRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setIsRunning(false);
    setCameraStatus("Camera: Stopped");
    toast.info("Recognition stopped");
  };

  const toggleCamera = async () => {
    const newCamera = currentCamera === "user" ? "environment" : "user";
    setCurrentCamera(newCamera);
    
    if (isRunning) {
      stopRecognition();
      setTimeout(() => {
        startRecognition();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Hand className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              ISL Recognition
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time Indian Sign Language translation powered by AI and MediaPipe
          </p>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="relative overflow-hidden shadow-medium bg-gradient-card">
              <div className="aspect-video relative bg-muted">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover hidden"
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  width="1280"
                  height="720"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {!isRunning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
                    <div className="text-center space-y-3">
                      <VideoOff className="w-16 h-16 mx-auto text-muted-foreground" />
                      <p className="text-lg font-medium text-muted-foreground">
                        Camera is off
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 justify-center">
              {!isRunning ? (
                <Button
                  onClick={startRecognition}
                  size="lg"
                  className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
                >
                  <Video className="w-5 h-5" />
                  Start Recognition
                </Button>
              ) : (
                <Button
                  onClick={stopRecognition}
                  size="lg"
                  variant="destructive"
                  className="gap-2"
                >
                  <VideoOff className="w-5 h-5" />
                  Stop
                </Button>
              )}

              {hasDualCamera && (
                <Button
                  onClick={toggleCamera}
                  size="lg"
                  variant="secondary"
                  className="gap-2"
                >
                  <SwitchCamera className="w-5 h-5" />
                  Toggle Camera
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">{cameraStatus}</p>
            </div>
          </div>

          {/* Recognition Output */}
          <div className="space-y-4">
            <Card className="p-6 shadow-soft bg-gradient-card">
              <h2 className="text-lg font-semibold mb-4 text-foreground">
                Last Letter
              </h2>
              <div className="text-6xl font-bold text-center text-primary">
                {letter}
              </div>
            </Card>

            <Card className="p-6 shadow-soft bg-gradient-card">
              <h2 className="text-lg font-semibold mb-3 text-foreground">
                Current Word
              </h2>
              <div className="text-2xl font-semibold text-center text-accent min-h-[2rem] break-all">
                {word || "-"}
              </div>
            </Card>

            <Card className="p-6 shadow-soft bg-gradient-card">
              <h2 className="text-lg font-semibold mb-3 text-foreground">
                Full Sentence
              </h2>
              <div className="text-lg text-foreground min-h-[6rem] break-words">
                {sentence || "Start recognition to see results..."}
              </div>
            </Card>
          </div>
        </div>

        {/* Info Section */}
        <Card className="p-6 shadow-soft bg-gradient-card">
          <h2 className="text-xl font-semibold mb-3 text-foreground">How it works</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Detects up to 2 hands (left and right) simultaneously</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Real-time hand landmark tracking using MediaPipe</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>WebSocket connection to ML backend for gesture recognition</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Live display of recognized letters, words, and sentences</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Index;
