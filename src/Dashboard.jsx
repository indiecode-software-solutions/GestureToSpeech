import { useEffect, useRef, useState } from "react";
import { createPortal } from 'react-dom';
import * as HandsNS from "@mediapipe/hands";
import * as CameraNS from "@mediapipe/camera_utils";
import * as DrawingNS from "@mediapipe/drawing_utils";

const Hands = HandsNS.Hands || window.Hands;
const Camera = CameraNS.Camera || window.Camera;
const drawConnectors = DrawingNS.drawConnectors || window.drawConnectors;
const drawLandmarks = DrawingNS.drawLandmarks || window.drawLandmarks;
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Mic, FileText, X, BookOpen, Activity, Download, GraduationCap, LogOut, User, CircleUserRound, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import GestureGuide from './GestureGuide';
import TrainingPanel from './TrainingPanel';
import { useAuth } from './contexts/AuthContext';
import {
    DEFAULT_QUICK_RESPONSES,
    getQuickResponseStorageKey,
    normalizeQuickResponses,
} from './data/quickResponses';
import { supabase } from './lib/supabase';
import "./App.css";

const QUICK_PANEL_KEY = 'q';
const PIP_STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: radial-gradient(circle at top right, rgba(119, 141, 169, 0.25), transparent 40%), #0d1b2a;
    color: #e0e1dd;
  }
  .pip-shell {
    min-height: 100vh;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .pip-shell.minimal {
    gap: 8px;
    padding: 10px;
  }
  .pip-card {
    border: 1px solid rgba(224, 225, 221, 0.2);
    border-radius: 14px;
    background: rgba(13, 27, 42, 0.88);
    padding: 12px;
  }
  .pip-shell.minimal .pip-card {
    padding: 8px;
    border-radius: 12px;
    }
  .pip-overline {
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #9bb0c8;
    margin-bottom: 8px;
    display: block;
  }
  .pip-sentence {
    min-height: 110px;
    border-radius: 10px;
    border: 1px solid rgba(224, 225, 221, 0.15);
    background: rgba(7, 15, 24, 0.7);
    padding: 10px;
    font-size: 16px;
    line-height: 1.4;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .pip-shell.minimal .pip-sentence {
    min-height: 200px;
    max-height: 200px;
    font-size: 23px;
    line-height: 1.35;
    font-weight: 600;
    padding: 14px;
  }
  .pip-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
  }
  .pip-mode-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
  }
  .pip-mode-btn {
    border: 1px solid rgba(224, 225, 221, 0.2);
    border-radius: 999px;
    background: rgba(27, 38, 59, 0.9);
    color: #e0e1dd;
    padding: 6px 10px;
    font-size: 11px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    cursor: pointer;
  }
  .pip-shortcuts {
    margin-top: 8px;
    border: 1px solid rgba(224, 225, 221, 0.18);
    border-radius: 10px;
    padding: 7px 9px;
    font-size: 11px;
    color: #b8c8da;
    background: rgba(7, 15, 24, 0.65);
    line-height: 1.4;
  }
  .pip-btn {
    border: 1px solid rgba(224, 225, 221, 0.2);
    border-radius: 10px;
    background: rgba(27, 38, 59, 0.9);
    color: #e0e1dd;
    padding: 10px;
    font-weight: 600;
    cursor: pointer;
  }
  .pip-btn.primary {
    background: #e0e1dd;
    color: #0d1b2a;
    border-color: transparent;
  }
  .pip-quick-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    max-height: 260px;
    overflow-y: auto;
  }
  .pip-quick-item {
    text-align: left;
    border: 1px solid rgba(224, 225, 221, 0.16);
    border-radius: 10px;
    background: rgba(65, 90, 119, 0.3);
    color: #e0e1dd;
    padding: 10px;
    cursor: pointer;
    line-height: 1.3;
    font-size: 13px;
  }
  .pip-shell.minimal .pip-quick-grid {
    grid-template-columns: 1fr 1fr;
    max-height: 290px;
    gap: 10px;
  }
  .pip-shell.minimal .pip-quick-item {
    min-height: 120px;
    font-size: 17px;
    line-height: 1.2;
    border-radius: 12px;
    text-align: center;
    font-weight: 700;
    padding: 12px;
    justify-content: center;
  }
  .pip-shell.minimal .pip-actions {
    grid-template-columns: 2fr 1fr;
    gap: 10px;
  }
  .pip-shell.minimal .pip-btn {
    min-height: 56px;
    font-size: 18px;
    border-radius: 12px;
  }
  .pip-shell.minimal .pip-overline {
    font-size: 10px;
  }
  .pip-shell.minimal .pip-card.secondary {
    border-style: dashed;
    background: rgba(7, 15, 24, 0.75);
  }
`;

export default function Dashboard() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [sentence, setSentence] = useState("");
    const sentenceRef = useRef("");
    const [gesture, setGesture] = useState("Waiting...");
    const [confidence, setConfidence] = useState(0);
    const [handDetected, setHandDetected] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const lastAddedTime = useRef(0);
    const lastGestureTime = useRef(Date.now());
    const [history, setHistory] = useState([]);
    const lastFrameTime = useRef(Date.now());
    const [isSmartMode, setIsSmartMode] = useState(false);
    const [isPolishing, setIsPolishing] = useState(false);
    const [polishedSentence, setPolishedSentence] = useState("");

    // Auth Context
    const { currentUser, logout } = useAuth();

    // ML State
    const classifier = useRef(null);
    const tfRef = useRef(null);
    const knnModule = useRef(null);
    const [trainingData, setTrainingData] = useState({});
    const mlPredictionRef = useRef(null);
    const trainingLabel = useRef(null);
    const [isTrainingOpen, setIsTrainingOpen] = useState(false);
    const [mlReady, setMlReady] = useState(false);
    const [quickResponses, setQuickResponses] = useState([]);
    const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
    const [isQuickPanelPinned, setIsQuickPanelPinned] = useState(false);
    const [pipWindow, setPipWindow] = useState(null);
    const [pipSupported, setPipSupported] = useState(false);
    const [pipMinimalMode, setPipMinimalMode] = useState(false);
    const [pipAutoSpeak, setPipAutoSpeak] = useState(false);
    const closeQuickPanelTimer = useRef(null);
    const pipContainerRef = useRef(null);
    const autoSpeakTimerRef = useRef(null);
    const lastAutoSpokenSentenceRef = useRef('');

    // Sync sentenceRef with sentence state for onResults callback
    useEffect(() => {
        sentenceRef.current = sentence;
    }, [sentence]);

    const loadQuickResponses = () => {
        const storageKey = getQuickResponseStorageKey(currentUser?.id);

        try {
            const raw = localStorage.getItem(storageKey);
            if (raw === null) {
                const legacyRaw = localStorage.getItem('isl-quick-phrases');
                const seeded = legacyRaw
                    ? normalizeQuickResponses(JSON.parse(legacyRaw))
                    : normalizeQuickResponses(DEFAULT_QUICK_RESPONSES);
                setQuickResponses(seeded);
                localStorage.setItem(storageKey, JSON.stringify(seeded));
                return;
            }

            const parsed = JSON.parse(raw);
            const normalized = normalizeQuickResponses(parsed);
            if (normalized.length === 0) {
                const seeded = normalizeQuickResponses(DEFAULT_QUICK_RESPONSES);
                setQuickResponses(seeded);
                localStorage.setItem(storageKey, JSON.stringify(seeded));
            } else {
                setQuickResponses(normalized);
            }
        } catch {
            const seeded = normalizeQuickResponses(DEFAULT_QUICK_RESPONSES);
            setQuickResponses(seeded);
            localStorage.setItem(storageKey, JSON.stringify(seeded));
        }
    };

    const cancelQuickPanelClose = () => {
        if (closeQuickPanelTimer.current) {
            clearTimeout(closeQuickPanelTimer.current);
            closeQuickPanelTimer.current = null;
        }
    };

    const scheduleQuickPanelClose = () => {
        cancelQuickPanelClose();
        if (isQuickPanelPinned) return;
        closeQuickPanelTimer.current = setTimeout(() => {
            setIsQuickPanelOpen(false);
        }, 250);
    };

    useEffect(() => {
        setPipSupported(typeof window !== 'undefined' && 'documentPictureInPicture' in window);
        loadQuickResponses();
        return () => {
            cancelQuickPanelClose();
            if (autoSpeakTimerRef.current) {
                clearTimeout(autoSpeakTimerRef.current);
                autoSpeakTimerRef.current = null;
            }
            if (pipWindow && !pipWindow.closed) {
                pipWindow.close();
            }
        };
    }, [currentUser?.id]);

    useEffect(() => {
        if (autoSpeakTimerRef.current) {
            clearTimeout(autoSpeakTimerRef.current);
            autoSpeakTimerRef.current = null;
        }

        if (!pipWindow || !pipMinimalMode || !pipAutoSpeak) return;

        const text = sentence.trim();
        if (!text || text === lastAutoSpokenSentenceRef.current) return;

        autoSpeakTimerRef.current = setTimeout(() => {
            speak(text, { fromAuto: true });
        }, 1200);

        return () => {
            if (autoSpeakTimerRef.current) {
                clearTimeout(autoSpeakTimerRef.current);
                autoSpeakTimerRef.current = null;
            }
        };
    }, [pipWindow, pipMinimalMode, pipAutoSpeak, sentence]);

    const openConferencePip = async () => {
        if (!pipSupported) {
            console.warn('Document Picture-in-Picture is not supported in this browser.');
            return;
        }

        if (pipWindow && !pipWindow.closed) {
            pipWindow.focus();
            return;
        }

        loadQuickResponses();

        try {
            const nextWindow = await window.documentPictureInPicture.requestWindow({
                width: 410,
                height: 620,
            });

            const styleTag = nextWindow.document.createElement('style');
            styleTag.textContent = PIP_STYLES;
            nextWindow.document.head.appendChild(styleTag);

            const mountNode = nextWindow.document.createElement('div');
            nextWindow.document.body.innerHTML = '';
            nextWindow.document.body.appendChild(mountNode);
            pipContainerRef.current = mountNode;
            setPipWindow(nextWindow);

            nextWindow.addEventListener('pagehide', () => {
                pipContainerRef.current = null;
                setPipWindow(null);
            }, { once: true });
        } catch (error) {
            console.warn('Unable to open conference PiP window.', error);
        }
    };

    const closeConferencePip = () => {
        if (pipWindow && !pipWindow.closed) {
            pipWindow.close();
        }
        pipContainerRef.current = null;
        setPipAutoSpeak(false);
        setPipWindow(null);
    };

    useEffect(() => {
        const onKeyDown = (event) => {
            const targetTag = event.target?.tagName?.toLowerCase();
            const isTyping = targetTag === 'input' || targetTag === 'textarea' || event.target?.isContentEditable;
            if (isTyping) return;

            if (event.key.toLowerCase() === QUICK_PANEL_KEY) {
                event.preventDefault();
                cancelQuickPanelClose();
                loadQuickResponses();
                setIsQuickPanelPinned((prev) => {
                    const next = !prev;
                    setIsQuickPanelOpen(next);
                    return next;
                });
            }

            if (event.key === 'Escape') {
                setIsQuickPanelPinned(false);
                setIsQuickPanelOpen(false);
                cancelQuickPanelClose();
                closeConferencePip();
            }

            if (pipWindow && pipMinimalMode) {
                const minimalResponses = quickResponses.slice(0, 4);

                if (event.key === 'Enter') {
                    event.preventDefault();
                    speak(sentence);
                }

                if (event.key === 'Backspace') {
                    event.preventDefault();
                    setSentence('');
                }

                if (['1', '2', '3', '4'].includes(event.key)) {
                    const response = minimalResponses[Number(event.key) - 1];
                    if (response) {
                        event.preventDefault();
                        speak(response);
                    }
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [pipWindow, pipMinimalMode, quickResponses, sentence]);

    // Load TensorFlow lazily (dynamic import prevents crash)
    useEffect(() => {
        let cancelled = false;
        async function loadML() {
            try {
                const tf = await import('@tensorflow/tfjs');
                const knn = await import('@tensorflow-models/knn-classifier');
                if (!cancelled) {
                    tfRef.current = tf;
                    knnModule.current = knn;
                    classifier.current = knn.create();

                    // Restore saved model from Supabase
                    if (currentUser) {
                        try {
                            const { data, error } = await supabase
                                .from('models')
                                .select('data')
                                .eq('user_id', currentUser.id)
                                .single();

                            if (data && data.data) {
                                const savedData = data.data;
                                if (savedData.dataset) {
                                    const dataset = savedData.dataset;
                                    const parsed = {};
                                    for (const key in dataset) {
                                        parsed[key] = tf.tensor(dataset[key].data, dataset[key].shape);
                                    }
                                    classifier.current.setClassifierDataset(parsed);
                                    setTrainingData(savedData.classes || {});
                                    console.log('✅ Restored saved gestures from Supabase');
                                }
                            }
                        } catch (e) {
                            console.warn('Could not restore saved model:', e);
                        }
                    }

                    setMlReady(true);
                    console.log('✅ ML engine loaded');
                }
            } catch (err) {
                console.warn('⚠️ ML engine failed to load:', err);
            }
        }
        loadML();
        return () => { cancelled = true; };
    }, [currentUser]);

    // Add a new gesture class (just register it with 0 examples)
    const addClass = (label) => {
        setTrainingData(prev => ({
            ...prev,
            [label]: prev[label] || 0
        }));
    };

    // Save model to DB
    const saveModel = async () => {
        if (!classifier.current || classifier.current.getNumClasses() === 0 || !currentUser) return;
        try {
            const dataset = classifier.current.getClassifierDataset();
            const serializedDataset = {};
            for (const key in dataset) {
                serializedDataset[key] = {
                    data: Array.from(dataset[key].dataSync()),
                    shape: dataset[key].shape
                };
            }

            const modelData = {
                dataset: serializedDataset,
                classes: trainingData
            };

            const { error } = await supabase
                .from('models')
                .upsert({
                    user_id: currentUser.id,
                    data: modelData,
                    updated_at: new Date()
                }, { onConflict: 'user_id' });

            if (error) throw error;
            console.log('✅ Model saved to Supabase');
        } catch (e) {
            console.warn('Could not save model:', e);
        }
    };

    // Start/stop recording examples for a class
    const startRecording = (label) => {
        trainingLabel.current = label;
    };
    const stopRecording = () => {
        trainingLabel.current = null;
        // Auto-save after each recording session
        saveModel();
        // Also update local state
        setTrainingData(prev => prev); // Trigger re-render if needed, but updated in loop
    };

    // Clear a class
    const clearClass = async (label) => {
        if (classifier.current) {
            classifier.current.clearClass(label);
            setTrainingData(prev => {
                const newData = { ...prev };
                delete newData[label];
                return newData;
            });

            // Save empty/updated model
            if (classifier.current.getNumClasses() === 0) {
                mlPredictionRef.current = null;
                // Ideally delete from DB or save empty, here saving empty
                saveModel();
            } else {
                saveModel();
            }
        }
    };

    useEffect(() => {
        const hands = new Hands({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
        });

        hands.onResults((results) => {
            if (!canvasRef.current) return;
            const canvasCtx = canvasRef.current.getContext("2d");
            const nowFrame = Date.now();
            const delta = nowFrame - lastFrameTime.current;
            setFps(Math.round(1000 / delta));
            lastFrameTime.current = nowFrame;

            canvasCtx.save();
            canvasCtx.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );

            canvasCtx.drawImage(
                results.image,
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );

            if (results.multiHandLandmarks.length > 0) {
                setHandDetected(true);

                if (results.multiHandLandmarks.length > 0) {
                    const landmarks = results.multiHandLandmarks[0];

                    drawConnectors(canvasCtx, landmarks, Hands.HAND_CONNECTIONS, {
                        color: "rgba(224, 225, 221, 0.5)",
                        lineWidth: 2,
                    });
                    drawLandmarks(canvasCtx, landmarks, {
                        color: "#E0E1DD",
                        lineWidth: 1,
                        radius: 2,
                    });

                    // --- Machine Learning Logic ---
                    if (classifier.current && tfRef.current) {
                        const tf = tfRef.current;
                        const features = tf.tensor(landmarks.map(p => [p.x, p.y, p.z]).flat());

                        // Training Mode — continuously captures while button held
                        if (trainingLabel.current) {
                            classifier.current.addExample(features, trainingLabel.current);
                            setTrainingData(prev => ({
                                ...prev,
                                [trainingLabel.current]: (prev[trainingLabel.current] || 0) + 1
                            }));
                        }

                        // Prediction Mode
                        if (classifier.current.getNumClasses() > 0 && !trainingLabel.current) {
                            classifier.current.predictClass(features).then(result => {
                                if (result.confidences[result.label] > 0.8) {
                                    mlPredictionRef.current = { label: result.label, confidence: result.confidences[result.label] };
                                } else {
                                    mlPredictionRef.current = null;
                                }
                            });
                        }
                        features.dispose();
                    }

                    const prediction = detectGesture(landmarks);
                    let finalLabel = prediction.label;
                    // Override with ML prediction if confident
                    if (mlPredictionRef.current && mlPredictionRef.current.confidence > 0.8) {
                        finalLabel = mlPredictionRef.current.label;
                    }
                    const stable = stablePrediction(finalLabel);

                    if (stable) {
                        setGesture(stable);
                        setConfidence(prediction.confidence);
                        lastGestureTime.current = Date.now();
                        const now = Date.now();
                        if (now - lastAddedTime.current > 1000) {
                            setSentence((prev) => prev + stable);
                            lastAddedTime.current = now;

                            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            setHistory((prev) => [
                                { id: Date.now(), text: stable, time: timeStr },
                                ...prev
                            ].slice(0, 50));
                        }
                    }
                }
            } else {
                setHandDetected(false);
            }

            const now = Date.now();
            // Check lastGestureTime and ensure we don't add space if empty or already has space
            // Using sentenceRef.current to avoid stale closure
            if (now - lastGestureTime.current > 2000 &&
                sentenceRef.current.length > 0 &&
                sentenceRef.current.slice(-1) !== " ") {
                setSentence((prev) => prev + " ");
                lastGestureTime.current = now;
            }
            canvasCtx.restore();
        });

        if (videoRef.current) {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    await hands.send({ image: videoRef.current });
                },
                width: 640,
                height: 480,
            });
            camera.start();
        }
    }, []);

    const polishSentence = async (rawText) => {
        if (!rawText || rawText.trim() === "") return "";
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        
        if (!apiKey) {
            console.error("OpenRouter API key missing!");
            return rawText;
        }

        setIsPolishing(true);
        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: "google/gemini-2.0-flash-001", // Or any other model
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert Indian Sign Language (ISL) translator. Your task is to take raw, choppy word sequences (e.g., 'I HUNGER WATER') and transform them into natural, polite, and grammatically correct English sentences (e.g., 'I am feeling hungry, could you please get me some water?'). Keep the meaning exactly the same but make it sound natural. Output ONLY the polished sentence."
                        },
                        {
                            role: "user",
                            content: `Translate these raw gestures into a polite sentence: "${rawText}"`
                        }
                    ],
                },
                {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": window.location.origin,
                        "X-Title": "ISL Gesture App"
                    }
                }
            );

            const polished = response.data.choices[0].message.content.trim();
            setPolishedSentence(polished);
            return polished;
        } catch (error) {
            console.error("Error polishing sentence:", error);
            return rawText;
        } finally {
            setIsPolishing(false);
        }
    };


    const speak = async (text, options = {}) => {
        if (!text || text.trim() === '') return;

        let textToSpeak = text;

        // If Smart Mode is on and this is the main sentence, polish it first
        if (isSmartMode && !options.fromAuto && text.trim() === sentence.trim()) {
            textToSpeak = await polishSentence(text);
        }

        if (options.fromAuto || text.trim() === sentence.trim()) {
            lastAutoSpokenSentenceRef.current = text.trim();
        }

        let voiceSettings = { rate: 0.9, pitch: 1.05, voiceName: '' };
        try {
            const parsed = JSON.parse(localStorage.getItem('isl-voice-settings') || '{}');
            voiceSettings = {
                rate: Number.isFinite(parsed.rate) ? parsed.rate : 0.9,
                pitch: Number.isFinite(parsed.pitch) ? parsed.pitch : 1.05,
                voiceName: typeof parsed.voiceName === 'string' ? parsed.voiceName : ''
            };
        } catch {
            voiceSettings = { rate: 0.9, pitch: 1.05, voiceName: '' };
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const allVoices = window.speechSynthesis.getVoices();

        // 1. If user chose a specific voice, use it directly via browser API
        if (voiceSettings.voiceName) {
            const selected = allVoices.find(v => v.name === voiceSettings.voiceName);
            if (selected) {
                utterance.voice = selected;
                utterance.rate = selected.name.includes("Google") ? (voiceSettings.rate || 0.9) * 1.1 : (voiceSettings.rate || 0.9);
                utterance.pitch = voiceSettings.pitch || 1.05;
                window.speechSynthesis.speak(utterance);
                return;
            }
        }

        // 2. Fallback to ResponsiveVoice for "Natural" default if no specific voice selected
        if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
            window.responsiveVoice.cancel();
            window.responsiveVoice.speak(textToSpeak, "UK English Female", {
                pitch: voiceSettings.pitch || 1,
                rate: (voiceSettings.rate || 0.9) * 1.1,
                volume: 1
            });
        } else {
            // 3. Fallback: browser speech with best available natural voice
            const preferredVoice =
                allVoices.find(v => v.name.includes("Google US English") && v.lang.includes("en")) ||
                allVoices.find(v => v.name.includes("Natural") || v.name.includes("Online")) ||
                allVoices.find(v => v.name.includes("Samantha") || v.name.includes("Siri")) ||
                allVoices.find(v => v.name.includes("Female") && v.lang.startsWith("en"));

            if (preferredVoice) {
                utterance.voice = preferredVoice;
                utterance.rate = preferredVoice.name.includes("Google") ? (voiceSettings.rate || 0.9) * 1.1 : (voiceSettings.rate || 0.9);
            } else {
                utterance.rate = voiceSettings.rate || 0.9;
            }
            
            utterance.pitch = voiceSettings.pitch || 1.05;
            window.speechSynthesis.speak(utterance);
        }
    };

    const exportText = () => {
        const blob = new Blob([sentence], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "isl-output.txt";
        a.click();
    };

    const detectGesture = (landmarks) => {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const thumbBase = landmarks[2];
        const indexBase = landmarks[5];
        const middleBase = landmarks[9];
        const ringBase = landmarks[13];
        const pinkyBase = landmarks[17];

        const isExtended = (tip, base) => tip.y < base.y;
        const indexUp = isExtended(indexTip, indexBase);
        const middleUp = isExtended(middleTip, middleBase);
        const ringUp = isExtended(ringTip, ringBase);
        const pinkyUp = isExtended(pinkyTip, pinkyBase);
        const thumbUp = thumbTip.y < thumbBase.y;

        const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

        // Simple Gesture Rules
        if (dist(thumbTip, indexTip) < 0.05 && middleUp && ringUp && pinkyUp) return { label: "F", confidence: 0.9 };
        if (indexUp && middleUp && ringUp && pinkyUp) return { label: "B", confidence: 0.9 };
        if (indexUp && middleUp && ringUp && !pinkyUp) return { label: "W", confidence: 0.9 };
        if (indexUp && middleUp && !ringUp && !pinkyUp) {
            if (indexTip.x > middleTip.x + 0.02) return { label: "R", confidence: 0.85 }; // Crossed
            if (dist(indexTip, middleTip) < 0.04) return { label: "U", confidence: 0.85 }; // Together
            if (dist(thumbTip, landmarks[9]) < 0.05) return { label: "K", confidence: 0.85 }; // K
            return { label: "V", confidence: 0.9 }; // Spread
        }
        if (indexUp && thumbUp && !middleUp && !ringUp && !pinkyUp) return { label: "L", confidence: 0.9 };
        if (indexUp && !middleUp && !ringUp && !pinkyUp) return { label: "D", confidence: 0.85 };
        if (!indexUp && !middleUp && !ringUp && pinkyUp && thumbUp) return { label: "Y", confidence: 0.9 };
        if (!indexUp && !middleUp && !ringUp && pinkyUp) return { label: "I", confidence: 0.9 };
        if (dist(thumbTip, indexTip) < 0.05 && dist(thumbTip, middleTip) < 0.05) return { label: "O", confidence: 0.85 };
        if (!indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp) return { label: "A", confidence: 0.9 };
        if (!indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) {
            if (thumbTip.y > indexBase.y) return { label: "E", confidence: 0.8 };
            return { label: "S", confidence: 0.8 };
        }

        return { label: "Unknown", confidence: 0 };
    };

    const predictionBuffer = useRef([]);

    const stablePrediction = (label) => {
        predictionBuffer.current.push(label);

        if (predictionBuffer.current.length > 10) {
            predictionBuffer.current.shift();
        }

        const counts = {};
        predictionBuffer.current.forEach((l) => {
            counts[l] = (counts[l] || 0) + 1;
        });

        const mostCommon = Object.keys(counts).reduce((a, b) =>
            counts[a] > counts[b] ? a : b
        );

        if (counts[mostCommon] >= 7 && mostCommon !== "Unknown") {
            return mostCommon;
        }

        return null;
    };

    return (
        <>
            <div className="app-container">
                {/* Main Camera Stage */}
                <div className="main-stage">

                    {/* Header / Top Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                                <Layers className="text-accent" size={24} color="#E0E1DD" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 }}>
                                    ISL <span style={{ color: 'var(--text-muted)' }}>Translate</span>
                                </h1>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div className="user-pill" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <User size={14} color="var(--accent)" />
                                <span>{currentUser?.name || currentUser?.email}</span>
                            </div>

                            <button
                                onClick={() => navigate('/account')}
                                className="btn-secondary"
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    cursor: 'pointer'
                                }}
                            >
                                <CircleUserRound size={18} />
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>Account</span>
                            </button>

                            <button
                                onClick={pipWindow ? closeConferencePip : openConferencePip}
                                className="btn-secondary"
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: pipWindow ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                    color: pipWindow ? '#0d1b2a' : 'white',
                                    cursor: pipSupported ? 'pointer' : 'not-allowed',
                                    opacity: pipSupported ? 1 : 0.55
                                }}
                                disabled={!pipSupported}
                                title={pipSupported ? 'Open floating conference controls' : 'PiP not supported in this browser'}
                            >
                                <MessageCircle size={18} />
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                    {pipWindow ? 'Close PiP' : 'Conference PiP'}
                                </span>
                            </button>

                            <button
                                className="btn-secondary"
                                onClick={() => setIsTrainingOpen(true)}
                                style={{
                                    background: isTrainingOpen ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                    color: isTrainingOpen ? 'black' : 'white',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer'
                                }}
                            >
                                <GraduationCap size={18} />
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>Train</span>
                            </button>

                            <button
                                onClick={() => setIsGuideOpen(true)}
                                className="btn-secondary"
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    cursor: 'pointer'
                                }}
                            >
                                <BookOpen size={18} />
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>Gestures</span>
                            </button>

                            <button
                                onClick={logout}
                                className="btn-secondary"
                                style={{
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="camera-wrapper">
                        <div className="overlay-top-left">
                            <div className="live-indicator">
                                <div className="dot"></div> Live Feed
                            </div>
                        </div>

                        <AnimatePresence>
                            {!handDetected && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'rgba(0,0,0,0.7)',
                                        padding: '12px 24px',
                                        borderRadius: '99px',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        fontWeight: 500,
                                        backdropFilter: 'blur(10px)',
                                        zIndex: 20
                                    }}
                                >
                                    Waiting for gesture...
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <video ref={videoRef} style={{ display: "none" }} />
                        <canvas ref={canvasRef} width="640" height="480" className="camera-feed" />

                        <button
                            className="quick-response-trigger"
                            onMouseEnter={() => {
                                cancelQuickPanelClose();
                                loadQuickResponses();
                                setIsQuickPanelOpen(true);
                            }}
                            onMouseLeave={scheduleQuickPanelClose}
                            onClick={() => {
                                cancelQuickPanelClose();
                                loadQuickResponses();
                                setIsQuickPanelPinned((prev) => {
                                    const next = !prev;
                                    setIsQuickPanelOpen(next);
                                    return next;
                                });
                            }}
                            aria-label="Open quick responses"
                            title={`Quick responses (${QUICK_PANEL_KEY.toUpperCase()})`}
                        >
                            <MessageCircle size={22} />
                        </button>

                        <AnimatePresence>
                            {isQuickPanelOpen && (
                                <motion.div
                                    className="quick-response-panel"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onMouseEnter={cancelQuickPanelClose}
                                    onMouseLeave={scheduleQuickPanelClose}
                                >
                                    <motion.div
                                        className="quick-response-orbit"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.95, opacity: 0 }}
                                    >
                                        <div className="quick-response-center">
                                            <span>Quick</span>
                                            <small>{QUICK_PANEL_KEY.toUpperCase()}</small>
                                        </div>

                                        {quickResponses.slice(0, 8).map((text, index, arr) => {
                                            const angle = (index / arr.length) * Math.PI * 2 - Math.PI / 2;
                                            const radius = arr.length <= 4 ? 110 : 145;
                                            const x = Math.cos(angle) * radius;
                                            const y = Math.sin(angle) * radius;

                                            return (
                                                <button
                                                    key={text}
                                                    className="quick-response-item"
                                                    style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
                                                    onClick={() => {
                                                        speak(text);
                                                        setIsQuickPanelPinned(false);
                                                        setIsQuickPanelOpen(false);
                                                        cancelQuickPanelClose();
                                                    }}
                                                    title={text}
                                                >
                                                    {text}
                                                </button>
                                            );
                                        })}

                                        {quickResponses.length === 0 && (
                                            <div className="quick-response-empty">No saved responses</div>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Real-time Metrics Panel */}
                    <div className="glass-panel gesture-display">
                        <div>
                            <span className="text-overline">Detected Gesture</span>
                            <div className="text-value" style={{ color: 'var(--accent)' }}>
                                {gesture === "Waiting..." ? <span style={{ opacity: 0.3, fontSize: '24px' }}>Waiting...</span> : gesture}
                            </div>
                        </div>

                        <div style={{ flex: 1, marginLeft: '40px', maxWidth: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span className="text-overline" style={{ margin: 0 }}>Model Confidence</span>
                                <span className="text-overline" style={{ margin: 0, color: 'var(--text-main)' }}>{(confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="confidence-meter">
                                <div
                                    className="confidence-fill"
                                    style={{ width: `${confidence * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Control Panel */}
                <div className="control-sidebar">
                    {/* Output Section */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="text-overline">Translation Output</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div 
                                    className={`smart-toggle ${isSmartMode ? 'active' : ''}`}
                                    onClick={() => setIsSmartMode(!isSmartMode)}
                                    title="AI Smart Mode: Polishes raw words into polite sentences"
                                >
                                    <Sparkles size={14} />
                                    <span>Smart Mode</span>
                                </div>
                                <span className="text-overline" style={{ color: 'var(--text-main)', cursor: 'pointer', margin: 0 }} onClick={() => {
                                    setSentence("");
                                    setPolishedSentence("");
                                }}>Clear</span>
                            </div>
                        </div>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <textarea
                                className={`output-box ${isSmartMode ? 'smart-active' : ''}`}
                                value={sentence}
                                onChange={(e) => setSentence(e.target.value)}
                                placeholder="Translated text will appear here..."
                                spellCheck="false"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    resize: 'none',
                                    backgroundColor: 'var(--bg-deep)',
                                    border: '1px solid var(--bg-surface)',
                                    outline: 'none',
                                    color: 'var(--text-main)',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    fontSize: '18px',
                                    lineHeight: '1.6',
                                    fontFamily: 'inherit'
                                }}
                            />
                            {isPolishing && (
                                <div className="polishing-overlay">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>AI is polishing...</span>
                                </div>
                            )}
                        </div>
                        
                        {isSmartMode && polishedSentence && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="polished-box"
                            >
                                <div className="polished-header">
                                    <Sparkles size={12} />
                                    <span>AI POLISHED</span>
                                </div>
                                <p>{polishedSentence}</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="action-grid">
                        <button className="btn btn-primary" onClick={() => speak(sentence)}>
                            <Mic size={18} /> Speak
                        </button>
                        <button className="btn btn-secondary" onClick={exportText}>
                            <Download size={18} /> Export
                        </button>
                        <button
                            onClick={() => setSentence("")}
                            style={{
                                gridColumn: 'span 2',
                                background: 'rgba(224, 225, 221, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'rgb(224, 225, 221)',
                                transition: '0.2s',
                                transform: 'scale(1)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px',
                                gap: '8px',
                                fontFamily: 'Space Grotesk',
                                fontWeight: 600
                            }}
                        >
                            <X size={18} strokeWidth={2.5} /> Clear Output
                        </button>
                    </div>

                    {/* History Section */}
                    <div className="glass-panel" style={{ height: '35%', display: 'flex', flexDirection: 'column' }}>
                        <span className="text-overline">Detection History</span>
                        <div className="history-log" style={{ flex: 1 }}>
                            <AnimatePresence mode="popLayout">
                                {history.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="history-item"
                                    >
                                        <span className="history-time">{item.time}</span>
                                        <span style={{ fontWeight: 500 }}>{item.text}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {history.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '13px' }}>
                                    No gestures detected yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {pipWindow && pipContainerRef.current && createPortal(
                <div className={`pip-shell ${pipMinimalMode ? 'minimal' : ''}`}>
                    <div className="pip-card">
                        <div className="pip-mode-row">
                            <span className="pip-overline" style={{ marginBottom: 0 }}>
                                {pipMinimalMode ? 'Call Mode: Minimal' : 'Live Sentence'}
                            </span>
                            <button className="pip-mode-btn" onClick={() => setPipMinimalMode((prev) => !prev)}>
                                {pipMinimalMode ? 'Switch Full' : 'Switch Minimal'}
                            </button>
                        </div>
                        <div className="pip-sentence">
                            {sentence.trim() || 'Start signing in the main window...'}
                        </div>
                        <div className="pip-actions">
                            <button className="pip-btn primary" onClick={() => speak(sentence)}>Speak</button>
                            <button className="pip-btn" onClick={() => setSentence('')}>Clear</button>
                        </div>
                    </div>

                    <div className={`pip-card ${pipMinimalMode ? 'secondary' : ''}`}>
                        <span className="pip-overline">Quick Responses</span>
                        <div className="pip-quick-grid">
                            {(pipMinimalMode ? quickResponses.slice(0, 4) : quickResponses.slice(0, 8)).map((text) => (
                                <button
                                    key={text}
                                    className="pip-quick-item"
                                    onClick={() => speak(text)}
                                    title={text}
                                >
                                    {text}
                                </button>
                            ))}
                            {quickResponses.length === 0 && (
                                <div className="pip-quick-item">No quick responses saved.</div>
                            )}
                        </div>
                        {pipMinimalMode && (
                            <div className="pip-shortcuts">
                                <button
                                    className="pip-mode-btn"
                                    style={{ marginBottom: '8px' }}
                                    onClick={() => setPipAutoSpeak((prev) => !prev)}
                                >
                                    {pipAutoSpeak ? 'Auto Speak: On' : 'Auto Speak: Off'}
                                </button>
                                <br />
                                Shortcuts: <strong>1-4</strong> quick response, <strong>Enter</strong> speak sentence,
                                <strong> Backspace</strong> clear sentence.
                            </div>
                        )}
                    </div>
                </div>,
                pipContainerRef.current,
            )}

            <GestureGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

            <TrainingPanel
                isOpen={isTrainingOpen}
                onClose={() => setIsTrainingOpen(false)}
                trainingData={trainingData}
                onAddClass={addClass}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onClearClass={clearClass}
                mlReady={mlReady}
            />
        </>
    );
}
