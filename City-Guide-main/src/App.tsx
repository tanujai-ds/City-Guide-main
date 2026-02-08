import { useState, useEffect, useRef } from 'react';
import { OpenAI } from "openai";
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Badge } from "@/components/ui/badge"
import { CornerDownLeft, Loader2 } from 'lucide-react';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import { motion } from 'framer-motion';
import { Analytics } from "@vercel/analytics/react"

const App = () => {
  const exampleMessages = [
    {
      heading: 'Know about',
      subheading: 'Ajinkyatara Fort',
      message: `Tell me about Ajinkyatara Fort in Satara. Include its historical significance and what I can expect when visiting.`
    },
    {
      heading: 'Tourist spots ',
      subheading: 'Satara',
      message: 'Give me list of all tourist spots in satara'
    },
    {
      heading: 'Best time to visit',
      subheading: 'Kaas Plateau',
      message: `When is the best time to visit Kaas Plateau, and what can I see there?`
    },
    {
      heading: 'Local cuisine in',
      subheading: 'Satara',
      message: `What are some must-try local dishes in Satara, and where can I find them?`
    }
  ];
  const [currentInput, setCurrentInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const openai = new OpenAI({
    apiKey: "d48ef017e3da08a74db860f88b3a0e7103581afbaef3b047371ce2b0776323d7",
    baseURL: "https://api.together.xyz/v1",
    dangerouslyAllowBrowser: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentInput(e.target.value);
  };

  const handleButtonClick = async () => {
    if (currentInput.trim() === '') {
      return;
    }
  
    setIsLoading(true);
    setGeneratedCode('');
  
    try {
      const stream = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: `You are a Satara City Guide App chatbot designed to provide comprehensive information about all places and attractions in Satara, Maharashtra, India. Your goal is to offer detailed information on each spot, including addresses and Google Map links for easy navigation. Always use the format: Google Map Location (https://www.google.com/maps/search/?api=1&query={location['name']}+{locationCity['Satara'].replace(' ', '+')}) when providing location links.

          In addition to basic details, you should suggest the best times to visit, provide information on pricing, expected expenses, and share images when possible. Feel free to offer additional suggestions relevant to the user's query.
          
          Rules:
          
          If asked a question outside the scope of this system prompt, reply with "Not sure."
          Questions about other cities are not allowed. Reply with "Not sure."
          Start responding only when a user inserts a query. Format your responses in markdown for better readability and include emojis where appropriate.
          
          For example:
          
          Historical Sites
          Natural Attractions
          Cultural Experiences
          Make your responses engaging and informative to enhance the user's experience. ` },
          { role: 'user', content: currentInput },
        ],
        model: 'meta-llama/Llama-3-70b-chat-hf',
        max_tokens: 5000,
        stream: true,
      });
  
      for await (const chunk of stream) {
        const [choice] = chunk.choices;
        const { content } = choice.delta;
        const partialContent = content;
        if (partialContent) {
          setGeneratedCode(prev => (prev || '') + partialContent);
        }
      }
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setIsLoading(false);
      setCurrentInput('');
    }
  };

  const handleGenerateCode = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleButtonClick();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      setCurrentInput(currentInput + '\n');
    }
  };

  const handlePromptClick = async (prompt: { heading?: string; subheading?: string; message: any; }) => {
    setCurrentInput(prompt.message);
    setSelectedPrompt(prompt.message);
    await handleButtonClick(); // Submit the form after setting the prompt
  };

  useEffect(() => {
    if (selectedPrompt !== '') {
      textareaRef.current?.focus();
      handleButtonClick();
    }
  }, [selectedPrompt]);

  const source = generatedCode || '';

  return (
    <div className="relative flex h-full min-h-screen flex-col rounded-xl p-4  lg:col-span-2" data-color-mode={"light"}>
      <Analytics />
      {source !== '' ? (
        <>
          <Badge className="absolute right-3 top-3">Satara Result</Badge>
          <br />

          <div className="flex-1">
            <MarkdownPreview source={source} style={{ padding: 26 }} />

          </div>
        </>
      ) : (
        <motion.div className="flex-1 mx-auto max-w-2xl px-4" initial={{ opacity: 0 }}
          animate={{ opacity: 1, translateY: -4 }}
          transition={{ duration: 2 }}>
          <div className="flex flex-col gap-2 rounded-lg border border-yellow-500 bg-background p-8">
            <h1 className="text-5xl md:text-6xl text-center font-semibold">
              City Guide ChatBot
            </h1>
            {selectedPrompt === '' && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold">Know About Places</h2>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {exampleMessages.map((prompt, index) => (
                    <div
                      key={index}
                      className="cursor-pointer rounded-lg  bg-[#fde047] p-4 hover:bg-gray-300"
                      onClick={() => handlePromptClick(prompt)}
                    >
                      <h3 className="text-lg font-semibold">
                        {prompt.heading} <span className="text-gray-600">{prompt.subheading}</span>
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      <br />
      <form className="sticky bottom-5 overflow-hidden rounded-lg border border-yellow-500 bg-opacity-75 backdrop-blur-md focus-within:ring-1 focus-within:ring-ring ">
        <Label htmlFor="message" className="sr-only">
          Message
        </Label>
        <textarea
          id="message"
          placeholder="Ask About City..."
          value={currentInput}
          onChange={handleInputChange}
          onKeyDown={handleGenerateCode}
          ref={textareaRef}
          className="min-h-12 resize-vertical border-0 bg-transparent p-3 shadow-none focus:outline-none focus:border-none w-full"
        autoFocus></textarea>
        <div className="flex items-center p-3 pt-0 ">
          <Button
            type="submit"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={handleButtonClick}
            disabled={isLoading || currentInput.trim() === ''}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                Search <CornerDownLeft className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default App;