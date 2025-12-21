"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import {
  Upload,
  FileText,
  Send,
  Loader2,
  Info,
  MessageSquare,
  Zap,
  CheckCircle2,
  Menu,
  X,
  ArrowRight,
  File,
  Mic,
  MicOff,
  Copy,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState("");
  const [processedFile, setProcessedFile] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    onError: (e) => {
      console.error(e);
      setIngestionStatus("Error generating response.");
    },
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isListening]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? " " : "") + transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, [setInput]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const initialSuggestions = [
    {
      label: "Summarize this",
      prompt: "Give me a concise summary of this document.",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      label: "Key findings",
      prompt: "Extract the key findings or main points.",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      label: "Action items",
      prompt: "List any action items or recommendations.",
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ];

  const followUpActions = [
    {
      label: "Tell me more",
      prompt: "Can you expand on that with more details?",
    },
    { label: "Simplify", prompt: "Explain that again in simpler terms." },
    {
      label: "Key Quotes",
      prompt: "What are the specific quotes related to this?",
    },
  ];

  const handleUpload = async () => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setIngestionStatus("File too large (max 10MB).");
      return;
    }

    setIsIngesting(true);
    setIngestionStatus("Uploading & processing...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setIngestionStatus("Ready to chat!");
      setProcessedFile(file.name);
      setFile(null);
    } catch (e) {
      console.error(e);
      setIngestionStatus("Error uploading file.");
    } finally {
      setIsIngesting(false);
      setTimeout(() => setIngestionStatus(""), 4000);
    }
  };

  const handleReset = () => {
    setProcessedFile(null);
    setFile(null);
    setMessages([]);
    setIngestionStatus("");
  };

  if (!processedFile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col items-center justify-center p-6 text-gray-900 font-sans">
        <div className="w-full max-w-xl space-y-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20 mb-4">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
              DocuMind
            </h1>
            <p className="text-lg text-gray-500 max-w-sm mx-auto leading-relaxed">
              Transform your static PDFs into an interactive knowledge base.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="border-3 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer group relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  {file ? file.name : "Drop your PDF here"}
                </p>
                <p className="text-sm text-gray-500">
                  {file ? "Ready to analyze" : "or click to browse (Max 10MB)"}
                </p>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || isIngesting}
                className={clsx(
                  "w-full mt-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg",
                  !file || isIngesting
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/30 hover:-translate-y-1"
                )}
              >
                {isIngesting ? (
                  <>
                    <Loader2 className="animate-spin w-6 h-6" /> Processing...
                  </>
                ) : (
                  <>
                    <span className="mr-1">Start Analysis</span>{" "}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {ingestionStatus && (
                <div
                  className={clsx(
                    "mt-6 p-4 rounded-xl text-sm text-center font-medium animate-in fade-in slide-in-from-top-2",
                    ingestionStatus.includes("Error")
                      ? "text-red-600 bg-red-50"
                      : "text-blue-600 bg-blue-50"
                  )}
                >
                  {ingestionStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-gray-900">DocuMind</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed md:relative z-50 w-80 bg-white border-r border-gray-200 h-screen flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 pt-16 md:pt-0 shadow-xl md:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <FileText className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              DocuMind
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Active Context
            </h2>

            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl mb-6 relative group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm text-blue-600">
                  <File className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold text-gray-900 truncate"
                    title={processedFile || ""}
                  >
                    {processedFile}
                  </p>
                  <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Indexed & Ready
                  </p>
                </div>
              </div>
            </div>

            <div className="my-6 border-t border-gray-100"></div>

            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Actions
            </h2>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-start gap-3 p-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
            >
              <div className="w-8 h-8 bg-gray-100 group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                <Upload className="w-4 h-4" />
              </div>
              Upload New PDF
            </button>
          </div>

          <div className="text-xs text-gray-400 text-center border-t border-gray-100 pt-6">
            <p>Powered by RAG & Vercel AI SDK</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen pt-16 md:pt-0 relative bg-white md:bg-gray-50/50">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-500 px-4">
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-3xl font-bold text-gray-900">
                  Document Ready!
                </h2>
                <p className="text-lg text-gray-500 leading-relaxed">
                  I've analyzed{" "}
                  <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                    {processedFile}
                  </span>
                  .
                  <br className="hidden md:block" /> Select a starter question
                  below or type your own.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
                {initialSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => append({ role: "user", content: s.prompt })}
                    className="flex flex-col items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      {s.icon}
                    </div>
                    <div>
                      <span className="text-base font-semibold text-gray-900 block mb-1 group-hover:text-blue-700 transition-colors">
                        {s.label}
                      </span>
                      <span className="text-xs text-gray-400 group-hover:text-gray-500">
                        Click to ask
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, index) => (
                <div key={m.id} className="space-y-4">
                  <div
                    className={clsx(
                      "flex flex-col max-w-[90%] md:max-w-[80%] animate-in slide-in-from-bottom-2 duration-300",
                      m.role === "user"
                        ? "self-end items-end"
                        : "self-start items-start"
                    )}
                  >
                    <div
                      className={clsx(
                        "px-6 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed",
                        m.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                      )}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          ul: ({ node, ...props }) => (
                            <ul
                              className="list-disc pl-4 space-y-1 my-2"
                              {...props}
                            />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol
                              className="list-decimal pl-4 space-y-1 my-2"
                              {...props}
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="pl-1" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <span className="font-bold" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="mb-2 last:mb-0" {...props} />
                          ),
                          a: ({ node, ...props }) => (
                            <a
                              className="underline hover:text-blue-200"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>

                    <span className="text-[11px] text-gray-400 mt-2 px-1 uppercase tracking-wide font-bold flex items-center gap-1">
                      {m.role === "user" ? (
                        "You"
                      ) : (
                        <>
                          <Zap className="w-3 h-3 text-amber-500" /> AI
                          Assistant
                        </>
                      )}
                    </span>
                  </div>

                  {index === messages.length - 1 &&
                    m.role === "assistant" &&
                    !isLoading && (
                      <div className="flex flex-wrap gap-2 animate-in fade-in duration-500 ml-4">
                        <div className="flex items-center gap-1 text-xs text-gray-400 mr-2">
                          <MessageSquare className="w-3 h-3" /> Suggested:
                        </div>
                        {followUpActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              append({ role: "user", content: action.prompt })
                            }
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            {action.label}
                          </button>
                        ))}
                        <button
                          onClick={() => reload()}
                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-100 transition-all flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </button>
                      </div>
                    )}
                </div>
              ))}

              {isLoading && (
                <div className="self-start flex items-center gap-2 p-4 bg-white border border-gray-100 rounded-xl shadow-sm animate-pulse">
                  <Loader2 className="animate-spin w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-500 font-medium">
                    Thinking...
                  </span>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        <div className="p-4 md:p-6 bg-white/90 backdrop-blur-lg border-t border-gray-200 sticky bottom-0 z-30">
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto relative flex gap-3 items-center"
          >
            <div className="relative flex-1">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask specifically about the document content..."
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl pl-6 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400 shadow-inner"
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={toggleListening}
                className={clsx(
                  "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                  isListening
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                )}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
