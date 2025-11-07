"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { useMessages, ChatMessage } from "@/app/context/MessageContext";
import { useClickOutside } from "@/app/hooks/useClickOutside";
import ButtonGeneral from "../ui/ButtonGeneral";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

const Chatbot = () => {
  const { messages, addMessage, sendUserMessageToAgent } = useMessages();
  const { data: session } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState<ChatMessage | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [userChatInput, setUserChatInput] = useState("");

  const chatbotRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastBubbleMessageIdRef = useRef<string | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useClickOutside(chatbotRef as RefObject<HTMLElement>, () => {
    if (isOpen) {
      setIsOpen(false);
      setShowBubble(false);
      setBubbleMessage(null);
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = null;
      }
      lastBubbleMessageIdRef.current = null;
    }
  });

  const toggleChatbot = () => {
    setIsOpen((prev) => {
      const newIsOpen = !prev;
      if (newIsOpen) {
        scrollToBottom();
        setShowBubble(false);
        setBubbleMessage(null);
        if (bubbleTimerRef.current) {
          clearTimeout(bubbleTimerRef.current);
          bubbleTimerRef.current = null;
        }
        lastBubbleMessageIdRef.current = null;
      }
      return newIsOpen;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = null;
      }
      setBubbleMessage(null);
      setShowBubble(false);
      lastBubbleMessageIdRef.current = null;
      return;
    }

    const latestMessage = messages[messages.length - 1];

    if (isOpen) {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = null;
      }
      setShowBubble(false);
      setBubbleMessage(null);
      lastBubbleMessageIdRef.current = null;
      scrollToBottom();
    } else {
      if (
        latestMessage.type !== "user" &&
        lastBubbleMessageIdRef.current !== latestMessage.id
      ) {
        if (bubbleTimerRef.current) {
          clearTimeout(bubbleTimerRef.current);
        }
        setShowBubble(true);
        setBubbleMessage(latestMessage);
        lastBubbleMessageIdRef.current = latestMessage.id;

        const timer = setTimeout(() => {
          setShowBubble(false);
          setBubbleMessage(null);
          lastBubbleMessageIdRef.current = null;
          bubbleTimerRef.current = null;
        }, 5000);

        bubbleTimerRef.current = timer;
      }
    }
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (!userChatInput.trim()) {
      return;
    }

    sendUserMessageToAgent(userChatInput);
    setUserChatInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={chatbotRef}>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <>
            <motion.div
              key="button"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <ButtonGeneral onClick={toggleChatbot}>
                <Image
                  src="/design_ia.png"
                  alt="Chatbot"
                  width={50}
                  height={50}
                />
                <AnimatePresence>
                  {showBubble && bubbleMessage && (
                    <motion.div
                      className={`absolute bottom-5 right-full min-w-64 p-3 rounded-lg shadow-xl text-sm   ${
                        bubbleMessage.type === "error"
                          ? "bg-red-700 text-white"
                          : bubbleMessage.type === "success"
                          ? "bg-green-700 text-white"
                          : bubbleMessage.type === "agent"
                          ? "bg-blue-700 text-white"
                          : "bg-gray-700 text-white"
                      }
                        `}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 20 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <p className="font-semibold mb-1"></p>
                      <p>{bubbleMessage.text}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ButtonGeneral>
            </motion.div>
          </>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-80 h-96 bg-gray-800 text-white rounded-lg shadow-lg flex flex-col"
          >
            <div className="p-3 bg-indigo-600 rounded-t-lg flex items-center">
              <span className="text-lg font-semibold flex-grow">
                Focuslist Agent
              </span>
            </div>

            <div className="flex-grow p-3 overflow-y-auto custom-scrollbar">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center mt-4">
                  Nenhuma mensagem ainda. Faça algo!
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-2 p-2 rounded-md ${
                      msg.type === "error"
                        ? "bg-red-700"
                        : msg.type === "success"
                        ? "bg-green-700"
                        : msg.type === "agent"
                        ? "bg-blue-700"
                        : "bg-gray-700"
                    } text-sm`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-xs text-gray-400 block mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-700">
              <input
                type="text"
                placeholder="Converse com o Focuslist Agent..."
                className="flex-grow p-2 bg-gray-700 text-white border border-gray-600 rounded-l-md text-sm focus:outline-none focus:border-indigo-500"
                value={userChatInput}
                onChange={(e) => setUserChatInput(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-r-md text-sm"
                aria-label="Enviar mensagem"
              >
                Enviar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
