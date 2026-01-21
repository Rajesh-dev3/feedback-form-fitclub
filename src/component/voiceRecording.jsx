import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaStop, FaTrash, FaPlay, FaPause } from "react-icons/fa";

const VoiceRecorder = ({ onAudioRecorded,onTranscriptLiveUpdate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingError, setRecordingError] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);
  const recognitionRef = useRef(null); // keep speech recognition persistent

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        if (onAudioRecorded) onAudioRecorded(blob, url, transcript);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingError(null);
      startSpeechRecognition();
    } catch (err) {
      console.error("Recording error:", err);
      setRecordingError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      stopSpeechRecognition();
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscript("");
    setIsPlaying(false);
    if (onAudioRecorded) onAudioRecorded(null, null, "");
  };

  const toggleAudioPlayback = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // ==== Web Speech API ====
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecordingError("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
         setTranscript((prev) => {
        const updated = prev + " " + finalTranscript;
        if (onTranscriptLiveUpdate) {
          onTranscriptLiveUpdate(updated);
        }
        return updated;
      });
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopSpeechRecognition();
    };
  }, []);

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
      {!isRecording && !audioUrl && (
        <button type="button" title="Start recording" onClick={startRecording} className="btn btn-sm btn-light">
          <FaMicrophone />
        </button>
      )}

      {isRecording && (
        <button type="button" title="Stop recording" onClick={stopRecording} className="btn btn-sm btn-danger">
          <FaStop />
        </button>
      )}

      {audioUrl && !isRecording && (
        <>
          <button
            type="button"
            onClick={toggleAudioPlayback}
            title={isPlaying ? "Pause" : "Play"}
            className="btn btn-sm btn-success"
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>

          <button
            type="button"
            onClick={deleteRecording}
            title="Delete recording"
            className="btn btn-sm btn-secondary"
          >
            <FaTrash />
          </button>
        </>
      )}

      {recordingError && <small className="text-danger">{recordingError}</small>}
    </div>
  );
};

export default VoiceRecorder;
