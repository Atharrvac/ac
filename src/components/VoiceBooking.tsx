import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Sparkles } from 'lucide-react';

interface VoiceBookingProps {
  onCommand: (cmd: { intent: 'book'; date?: Date; time?: string; address?: string }) => void;
}

export const VoiceBooking = ({ onCommand }: VoiceBookingProps) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.continuous = false;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };
      rec.onend = () => {
        setListening(false);
        parseCommand(transcript.trim());
      };
      recognitionRef.current = rec;
    }
  }, [transcript]);

  const start = () => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setListening(true);
    recognitionRef.current.start();
  };

  const stop = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  };

  function parseCommand(text: string) {
    if (!text) return;
    const lower = text.toLowerCase();
    // Simple intents: "book pickup", optional time phrases
    if (lower.includes('book') && lower.includes('pickup')) {
      let date = new Date();
      if (lower.includes('tomorrow')) {
        date.setDate(date.getDate() + 1);
      }
      // parse time like "at 10" or "at 10 am" / "at 16:00"
      let time: string | undefined;
      const m = lower.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (m) {
        let h = parseInt(m[1], 10);
        const mm = m[2] ? parseInt(m[2], 10) : 0;
        const ap = m[3];
        if (ap === 'pm' && h < 12) h += 12;
        if (ap === 'am' && h === 12) h = 0;
        time = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      }
      // address after keyword 'at' for place, try simple capture
      let address: string | undefined;
      const addrMatch = lower.match(/address\s+(.*)$/);
      if (addrMatch) address = addrMatch[1];
      onCommand({ intent: 'book', date, time, address });
    }
  }

  const supported = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {listening && <Badge variant="secondary" className="bg-red-500/10 text-red-500">Listening…</Badge>}
      <Button variant={listening ? 'destructive' : 'outline'} size="sm" onClick={listening ? stop : start}>
        {listening ? <Square className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
        {listening ? 'Stop' : 'Voice Book'}
      </Button>
      {!listening && transcript && (
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {transcript}
        </div>
      )}
    </div>
  );
};

export default VoiceBooking;
