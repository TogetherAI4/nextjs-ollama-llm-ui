"use client";

import React, { useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "../ui/button";
import { CaretSortIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Sidebar } from "../sidebar";
import { Message } from "ai/react";
import { getSelectedModel } from "@/lib/model-helper";

interface ChatTopbarProps {
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  chatId?: string;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
}

export default function ChatTopbar({
  setSelectedModel,
  isLoading,
  chatId,
  messages,
  setMessages
}: ChatTopbarProps) {
  const [models, setModels] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [currentModel, setCurrentModel] = React.useState<string | null>(null);

  useEffect(() => {
    setCurrentModel(getSelectedModel());

    const env = process.env.NODE_ENV;

    const fetchModels = async () => {
      try {
        const url = env === "production"
          ? process.env.NEXT_PUBLIC_OLLAMA_URL + "/api/tags"
          : "/api/tags";
        
        const fetchedModels = await fetch(url);

        // Überprüfen, ob die Antwort erfolgreich ist (Status 200-299)
        if (!fetchedModels.ok) {
          console.error("Fehler beim Abrufen der Modelle:", fetchedModels.statusText);
          return; // Beendet die Ausführung, wenn ein Fehler vorliegt
        }

        // Antworttext extrahieren
        const text = await fetchedModels.text();

        // Überprüfen, ob die Antwort leer ist
        if (!text) {
          console.error("Leere Antwort von der API");
          return;
        }

        // Versuche, die Antwort als JSON zu parsen
        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          console.error("Fehler beim Parsen der JSON-Antwort:", e);
          return;
        }

        // Überprüfe, ob das JSON-Objekt die erwartete Struktur hat
        if (json.models && Array.isArray(json.models)) {
          const apiModels = json.models.map((model: any) => model.name);
          setModels([...apiModels]);
        } else {
          console.error("Unerwartete JSON-Struktur:", json);
        }
      } catch (error) {
        console.error("Fehler beim Abrufen der Modelle:", error);
      }
    };

    fetchModels();
  }, []);

  const handleModelChange = (model: string) => {
    setCurrentModel(model);
    setSelectedModel(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem("selectedModel", model);
    }
    setOpen(false);
  };

  const handleCloseSidebar = () => {
    setSheetOpen(false);  // Close the sidebar
  };

  return (
    <div className="w-full flex px-4 py-6 items-center justify-between lg:justify-center ">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger>
          <HamburgerMenuIcon className="lg:hidden w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left">
          <Sidebar
            chatId={chatId || ""}
            isCollapsed={false}
            isMobile={false}
            messages={messages}
            setMessages={setMessages}
            closeSidebar={handleCloseSidebar} 
          />
        </SheetContent>
      </Sheet>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between"
          >
            {currentModel || "Select model"}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-1">
          {models.length > 0 ? (
            models.map((model) => (
              <Button
                key={model}
                variant="ghost"
                className="w-full"
                onClick={() => {
                  handleModelChange(model);
                }}
              >
                {model}
              </Button>
            ))
          ) : (
            <Button variant="ghost" disabled className="w-full">
              No models available
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
