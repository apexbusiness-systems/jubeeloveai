import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeVoiceInput, checkPronunciation } from '@/lib/voiceInputSanitizer';
import { useJubeeStore } from '@/store/useJubeeStore';
import { Mic, Volume2, ArrowLeft, Trophy, Star } from 'lucide-react';
import { 
  getRandomWords, 
  categoryLabels, 
  type WordCategory, 
  type DifficultyLevel,
  type ReadingWord 
} from '@/data/readingWordLibrary';

export default function ReadingPractice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { speak, updatePosition } = useJubeeStore();
  
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | 'all'>('all');
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('easy');
  const [currentWord, setCurrentWord] = useState<ReadingWord | null>(null);
  const [wordQueue, setWordQueue] = useState<ReadingWord[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    total: 0,
    streak: 0,
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize word queue
  useEffect(() => {
    loadNextWords();
  }, [selectedCategory, currentDifficulty]);

  // Load next set of words
  const loadNextWords = () => {
    const category = selectedCategory === 'all' ? undefined : selectedCategory;
    const words = getRandomWords(5, currentDifficulty, category);
    setWordQueue(words);
    setCurrentWord(words[0] || null);
  };

  // Progress to next difficulty level
  const progressDifficulty = () => {
    if (currentDifficulty === 'easy') {
      setCurrentDifficulty('medium');
      toast({
        title: "Level Up! 🎉",
        description: "You're ready for medium words!",
      });
      speak("Wow! You're doing great! Let's try medium words!", 'happy');
    } else if (currentDifficulty === 'medium') {
      setCurrentDifficulty('hard');
      toast({
        title: "Amazing! 🌟",
        description: "You're ready for hard words!",
      });
      speak("You're amazing! Let's try harder words!", 'excited');
    }
  };

  // Check if should progress based on success rate
  const checkProgression = () => {
    const { correct, total } = sessionStats;
    if (total >= 10) {
      const successRate = correct / total;
      
      if (successRate >= 0.8 && currentDifficulty !== 'hard') {
        progressDifficulty();
        setSessionStats({ correct: 0, total: 0, streak: 0 });
      } else if (successRate < 0.4 && currentDifficulty !== 'easy') {
        // Regress difficulty if struggling
        const newDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
        setCurrentDifficulty(newDifficulty);
        toast({
          title: "Let's practice more!",
          description: "Don't worry, we'll take it a bit slower.",
        });
        speak("That's okay! Let's try easier words together.", 'curious');
        setSessionStats({ correct: 0, total: 0, streak: 0 });
      }
    }
  };

  // Move to next word
  const nextWord = () => {
    const remaining = wordQueue.slice(1);
    
    if (remaining.length === 0) {
      loadNextWords();
    } else {
      setWordQueue(remaining);
      setCurrentWord(remaining[0]);
    }
    
    checkProgression();
  };

  // Speak the word using text-to-speech
  const speakWord = async (text: string) => {
    const { speak } = useJubeeStore.getState();
    await speak(text, 'happy');
  };

  // Start recording
  const startRecording = async () => {
    try {
      speak("I'm listening!", 'curious');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 3000);

    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to practice pronunciation.",
        variant: "destructive",
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process the recorded audio
  const processRecording = async () => {
    if (!currentWord || audioChunksRef.current.length === 0) return;

    setIsProcessing(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const sanitized = sanitizeVoiceInput(base64Audio);

        const { data, error } = await supabase.functions.invoke('speech-to-text', {
          body: { audio: sanitized }
        });

        if (error) throw error;

        const spokenText = data?.text?.toLowerCase().trim() || '';
        const result = checkPronunciation(spokenText, currentWord.word);

        handlePronunciationResult(result, spokenText);
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Error",
        description: "Couldn't process your pronunciation. Please try again!",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle pronunciation result
  const handlePronunciationResult = async (result: { isCorrect: boolean; similarity: number }, spokenText: string) => {
    if (!currentWord) return;

    const newStats = {
      ...sessionStats,
      total: sessionStats.total + 1,
    };

    if (result.isCorrect || result.similarity >= 0.7) {
      // Correct pronunciation
      newStats.correct += 1;
      newStats.streak += 1;

      updatePosition({ x: Math.random() * 6 - 3, y: Math.random() * 4 - 2, z: 0 });

      const encouragement = [
        "Perfect! You said it so well!",
        "Great job! That was excellent!",
        "Wonderful! You're a reading star!",
        "Amazing! Keep it up!",
      ][Math.floor(Math.random() * 4)];

      await speakWord(encouragement);
      
      toast({
        title: "Correct! 🎉",
        description: `You said "${currentWord.word}" perfectly!`,
      });

      setTimeout(nextWord, 2000);
      
    } else {
      // Incorrect pronunciation
      newStats.streak = 0;

      const correction = `You said "${spokenText}". Let's try "${currentWord.word}" again. ${currentWord.hint ? currentWord.hint : ''}`;
      await speakWord(correction);

      toast({
        title: "Let's try again!",
        description: correction,
      });
    }

    setSessionStats(newStats);
  };

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-lg">Loading words...</p>
        </Card>
      </div>
    );
  }

  const successRate = sessionStats.total > 0 
    ? Math.round((sessionStats.correct / sessionStats.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back Home
        </Button>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg">
            <Trophy className="mr-2 h-4 w-4" />
            {sessionStats.streak} Streak
          </Badge>
          <Badge variant="outline" className="text-lg">
            <Star className="mr-2 h-4 w-4" />
            {successRate}% Success
          </Badge>
        </div>
      </div>

      {/* Category Selection */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            size="sm"
          >
            All Words
          </Button>
          {(Object.keys(categoryLabels) as WordCategory[]).map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
            >
              {categoryLabels[cat].emoji} {categoryLabels[cat].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Difficulty: <strong className="capitalize text-foreground">{currentDifficulty}</strong>
          </span>
          <span className="text-sm text-muted-foreground">
            Progress: {sessionStats.total}/10 words
          </span>
        </div>
        <Progress value={(sessionStats.total % 10) * 10} className="h-2" />
      </div>

      {/* Main Card */}
      <Card className="max-w-4xl mx-auto p-12 text-center">
        <Badge className="mb-6" variant="secondary">
          {categoryLabels[currentWord.category].emoji} {categoryLabels[currentWord.category].label}
        </Badge>

        {/* Word Display */}
        <div className="mb-8">
          <div className="text-9xl mb-6">{currentWord.image}</div>
          <h1 className="text-6xl font-bold mb-4 text-primary">{currentWord.word}</h1>
          {currentWord.hint && (
            <p className="text-xl text-muted-foreground italic">{currentWord.hint}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center items-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => speakWord(`The word is ${currentWord.word}. ${currentWord.pronunciation}`)}
            disabled={isRecording || isProcessing}
          >
            <Volume2 className="mr-2 h-5 w-5" />
            Hear Word
          </Button>

          <Button
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={isRecording ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            <Mic className="mr-2 h-5 w-5" />
            {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Say the Word'}
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={nextWord}
            disabled={isRecording || isProcessing}
          >
            Skip Word
          </Button>
        </div>

        {/* Recording Status */}
        {isRecording && (
          <p className="mt-6 text-lg text-primary animate-pulse">
            🎤 Listening... speak now!
          </p>
        )}
        {isProcessing && (
          <p className="mt-6 text-lg text-primary animate-pulse">
            🤔 Checking your pronunciation...
          </p>
        )}
      </Card>

      {/* Stats Footer */}
      <div className="max-w-4xl mx-auto mt-6 text-center text-sm text-muted-foreground">
        <p>
          Words practiced: {sessionStats.total} | Correct: {sessionStats.correct} | 
          Current streak: {sessionStats.streak} 🔥
        </p>
      </div>
    </div>
  );
}
