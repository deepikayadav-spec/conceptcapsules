import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  currentTopic?: string;
}

export function AIChatPanel({ isOpen, onToggle, currentTopic }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm Capsule AI 🧠 Ask me anything about ${currentTopic || 'Python'} or the current video. I'm here to help you understand concepts better!`,
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate AI response (placeholder)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm a placeholder AI assistant. In the full version, I'll help you understand Python concepts, answer questions about the current video, and provide additional examples! 🚀",
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-full glass border-l border-border/50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">Capsule AI</h3>
                  <p className="text-xs text-muted-foreground">Your study buddy</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="rounded-xl hover:bg-muted h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    message.role === 'assistant' 
                      ? 'gradient-secondary' 
                      : 'gradient-primary'
                  )}>
                    {message.role === 'assistant' ? (
                      <Bot className="w-4 h-4 text-secondary-foreground" />
                    ) : (
                      <User className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <div className={cn(
                    'flex-1 p-3 rounded-2xl text-sm',
                    message.role === 'assistant'
                      ? 'bg-muted text-foreground rounded-tl-none'
                      : 'gradient-primary text-primary-foreground rounded-tr-none'
                  )}>
                    {message.content}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about the concept..."
                className="rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="rounded-xl gradient-primary shrink-0"
                disabled={!input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">A</kbd> to toggle
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onToggle}
          className="h-full w-12 glass border-l border-border/50 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-xs font-medium text-muted-foreground [writing-mode:vertical-lr]">
            Ask AI
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
