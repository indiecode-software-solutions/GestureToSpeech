import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clipboard, Clock3, LogOut, Plus, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  DEFAULT_QUICK_RESPONSES,
  getQuickResponseStorageKey,
  normalizeQuickResponses,
} from '../data/quickResponses';
import './Account.css';

const readVoiceSettings = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem('isl-voice-settings') || '{}');
    return {
      rate: Number.isFinite(parsed.rate) ? parsed.rate : 0.95,
      pitch: Number.isFinite(parsed.pitch) ? parsed.pitch : 1,
      voiceName: typeof parsed.voiceName === 'string' ? parsed.voiceName : '',
    };
  } catch {
    return { rate: 0.95, pitch: 1, voiceName: '' };
  }
};

const formatUpdatedAt = (updatedAt) => {
  if (!updatedAt) return 'No save yet';
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return 'Saved';
  return date.toLocaleString();
};

export default function Account() {
  const { currentUser, logout } = useAuth();
  const [classes, setClasses] = useState({});
  const [updatedAt, setUpdatedAt] = useState(null);
  const [status, setStatus] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const [savedPhrases, setSavedPhrases] = useState([]);
  const [phrasesReady, setPhrasesReady] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState(readVoiceSettings);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadModelSummary = async () => {
      if (!currentUser?.id) return;
      try {
        const { data, error } = await supabase
          .from('models')
          .select('data, updated_at')
          .eq('user_id', currentUser.id)
          .single();

        if (cancelled) return;
        if (data) {
          setClasses(data.data?.classes || {});
          setUpdatedAt(data.updated_at || null);
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('Could not load model stats.');
        }
      }
    };
    loadModelSummary();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;

    setPhrasesReady(false);
    const storageKey = getQuickResponseStorageKey(currentUser.id);

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) {
        const legacyRaw = localStorage.getItem('isl-quick-phrases');
        const seeded = legacyRaw
          ? normalizeQuickResponses(JSON.parse(legacyRaw))
          : normalizeQuickResponses(DEFAULT_QUICK_RESPONSES);

        setSavedPhrases(seeded);
        localStorage.setItem(storageKey, JSON.stringify(seeded));
        setPhrasesReady(true);
        return;
      }

      const parsed = JSON.parse(raw);
      const normalized = normalizeQuickResponses(parsed);
      if (normalized.length === 0) {
        const seeded = normalizeQuickResponses(DEFAULT_QUICK_RESPONSES);
        setSavedPhrases(seeded);
        localStorage.setItem(storageKey, JSON.stringify(seeded));
      } else {
        setSavedPhrases(normalized);
      }
    } catch {
      const seeded = normalizeQuickResponses(DEFAULT_QUICK_RESPONSES);
      setSavedPhrases(seeded);
      localStorage.setItem(storageKey, JSON.stringify(seeded));
    }

    setPhrasesReady(true);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || !phrasesReady) return;
    const storageKey = getQuickResponseStorageKey(currentUser.id);
    localStorage.setItem(storageKey, JSON.stringify(savedPhrases));
  }, [currentUser?.id, phrasesReady, savedPhrases]);

  useEffect(() => {
    localStorage.setItem('isl-voice-settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const filteredVoices = useMemo(() => {
    // Novelty/System voices to exclude
    const noiseVoices = [
      'Bad News', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Deranged', 
      'Good News', 'Hysterical', 'Pipe Organ', 'Trinoids', 'Whisper', 'Zarvox',
      'Albert', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Hysterical',
      'Junior', 'Kathy', 'Princess', 'Ralph', 'Trinoids', 'Whisper', 'Zarvox'
    ];
    
    return voices.filter(v => {
      const isEnglish = v.lang.startsWith('en');
      const isSystemNoise = noiseVoices.some(name => v.name.includes(name));
      return isEnglish && !isSystemNoise;
    });
  }, [voices]);

  const stats = useMemo(() => {
    const entries = Object.entries(classes);
    const totalSamples = entries.reduce((sum, [, count]) => sum + count, 0);
    return { classes: entries.length, totalSamples };
  }, [classes]);

  const speak = (text) => {
    if (!text?.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const allVoices = window.speechSynthesis.getVoices();

    // 1. If user chose a specific voice, use it directly via browser API
    if (voiceSettings.voiceName) {
      const selected = allVoices.find(v => v.name === voiceSettings.voiceName);
      if (selected) {
        utterance.voice = selected;
        utterance.rate = selected.name.includes("Google") ? (voiceSettings.rate || 0.95) * 1.1 : (voiceSettings.rate || 0.95);
        utterance.pitch = voiceSettings.pitch || 1;
        window.speechSynthesis.speak(utterance);
        setStatus(`Spoken with ${selected.name}`);
        return;
      }
    }

    // 2. Fallback to ResponsiveVoice for "Natural" default if no specific voice selected
    if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
      window.responsiveVoice.cancel();
      window.responsiveVoice.speak(text, "UK English Female", {
        pitch: voiceSettings.pitch || 1,
        rate: (voiceSettings.rate || 0.95) * 1.1,
        volume: 1
      });
      setStatus('Spoken (Premium Fallback).');
    } else {
      // 3. Fallback to best available system voice
      const preferredVoice =
        allVoices.find(v => v.name === "Google UK English Female") ||
        allVoices.find(v => v.name.includes("Microsoft") && v.name.includes("Online")) ||
        allVoices.find(v => v.name.includes("Google") && v.name.includes("Online")) ||
        allVoices.find(v => v.name.includes("Natural")) ||
        allVoices.find(v => v.name.includes("Google US English") && v.lang.includes("en")) ||
        allVoices.find(v => v.name.includes("Samantha") || v.name.includes("Siri")) ||
        allVoices.find(v => v.name.includes("Female") && v.lang.startsWith("en"));

      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = voiceSettings.rate || 0.95;
      utterance.pitch = voiceSettings.pitch || 1;
      window.speechSynthesis.speak(utterance);
      setStatus('Spoken.');
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied.');
    } catch {
      setStatus('Copy failed.');
    }
  };

  const addPhrase = () => {
    const phrase = newPhrase.trim();
    if (!phrase) return;
    if (savedPhrases.includes(phrase)) {
      setStatus('Already added.');
      return;
    }
    setSavedPhrases((prev) => [phrase, ...prev].slice(0, 16));
    setNewPhrase('');
    setStatus('Phrase added.');
  };

  const removePhrase = (phrase) => {
    setSavedPhrases((prev) => prev.filter((item) => item !== phrase));
  };

  return (
    <div className="account-page">
      <div className="account-gradient" aria-hidden="true" />
      <div className="account-shell">
        <header className="account-header compact">
          <div>
            <h1>Communication Tools</h1>
            <p>{currentUser?.name || currentUser?.email}</p>
          </div>
          <div className="account-actions">
            <Link to="/" className="account-btn account-btn-muted">
              <ArrowLeft size={16} /> Dashboard
            </Link>
            <button type="button" className="account-btn account-btn-danger" onClick={logout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <section className="account-grid slim">
          <article className="account-card account-card-wide">
            <h2>Quick Phrases ({savedPhrases.length})</h2>
            <div className="account-add-row">
              <input
                type="text"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="Add your own phrase"
              />
              <button type="button" onClick={addPhrase}>
                <Plus size={14} /> Add
              </button>
            </div>

            <div className="account-phrase-grid">
              {savedPhrases.map((phrase) => (
                <div key={phrase} className="account-phrase-item">
                  <p>{phrase}</p>
                  <div className="account-phrase-actions">
                    <button type="button" onClick={() => speak(phrase)}>
                      <Volume2 size={14} /> Speak
                    </button>
                    <button type="button" onClick={() => copy(phrase)}>
                      <Clipboard size={14} /> Copy
                    </button>
                    <button type="button" onClick={() => removePhrase(phrase)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {!!status && <div className="account-feedback">{status}</div>}
          </article>

          <article className="account-card">
            <h2>Voice Output</h2>
            <label className="voice-row">
              Rate: {voiceSettings.rate.toFixed(2)}
              <input
                type="range"
                min="0.7"
                max="1.2"
                step="0.01"
                value={voiceSettings.rate}
                onChange={(e) => setVoiceSettings((prev) => ({ ...prev, rate: Number(e.target.value) }))}
              />
            </label>
            <label className="voice-row">
              Pitch: {voiceSettings.pitch.toFixed(2)}
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.01"
                value={voiceSettings.pitch}
                onChange={(e) => setVoiceSettings((prev) => ({ ...prev, pitch: Number(e.target.value) }))}
              />
            </label>
            <label className="voice-row">
              Voice
              <select
                value={voiceSettings.voiceName}
                onChange={(e) => setVoiceSettings((prev) => ({ ...prev, voiceName: e.target.value }))}
              >
                <option value="">Default</option>
                {filteredVoices.map((voice) => (
                  <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="account-btn voice-test" onClick={() => speak('Hello, this is my voice output test.')}>Test Voice</button>
          </article>

          <article className="account-card">
            <h2>Model Snapshot</h2>
            <div className="account-health-list">
              <div>Saved classes: {stats.classes}</div>
              <div>Captured samples: {stats.totalSamples}</div>
              <div>Last sync: {formatUpdatedAt(updatedAt)}</div>
              <div><Clock3 size={14} /> Keep using Dashboard for live camera gestures.</div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
