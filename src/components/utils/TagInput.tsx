"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Tag {
  id?: string | number;
  label: string;
}

interface TagInputProps {
  value?: Tag[];
  onChange?: (tags: Tag[]) => void;
  onSearch?: (query: string) => Promise<Tag[]>; // chamada de busca externa
  onCreate?: (label: string) => Promise<Tag>;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

export function TagInput({
  value = [],
  onChange,
  onSearch,
  onCreate,
  placeholder = "Digite e pressione Enter...",
  maxTags,
  disabled,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🔍 Busca sugestões com debounce
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (onSearch && inputValue.trim()) {
        setLoading(true);
        const result = await onSearch(inputValue);
        setSuggestions(Array.isArray(result) ? result : []);
        setShowDropdown(true);
        setLoading(false);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [inputValue, onSearch]);

  // 🧩 Adiciona tag (nova ou selecionada)
  const addTag = (tag: Tag) => {
    if (
      !tag.label.trim() ||
      value.some((t) => t.label.toLowerCase() === tag.label.toLowerCase())
    )
      return;

    if (maxTags && value.length >= maxTags) return;

    const newTags = [...value, tag];
    onChange?.(newTags);
    setInputValue("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const removeTag = (label: string) => {
    const newTags = value.filter((t) => t.label !== label);
    onChange?.(newTags);
  };

  // ⌨️ Pressionar Enter ou Tab
  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    const label = inputValue.trim();

    if (e.key === "Tab" && suggestions.length > 0) {
      e.preventDefault();
      addTag(suggestions[0]);
      return;
    }

    if (e.key === "Enter" && label) {
      e.preventDefault();

      const existing = suggestions.find(
        (s) => s.label.toLowerCase() === label.toLowerCase()
      );
      if (existing) {
        addTag(existing);
        return;
      }

      const tempTag = { id: `temp-${Date.now()}`, label };

      // adiciona e obtém o novo estado (mais seguro)
      const newTags = [...value, tempTag];
      onChange?.(newTags);

      if (onCreate) {
        onCreate(label)
          .then((persisted) => {
            const updatedTags = newTags.map((t) =>
              t.id === tempTag.id ? persisted : t
            );
            onChange?.(updatedTags); // ✅ usa newTags, não value antigo
          })
          .catch((err) => console.error("Erro ao persistir tag:", err));
      }

      setInputValue("");
      setSuggestions([]);
      setShowDropdown(false);
    }

    if (e.key === "Escape") setShowDropdown(false);
  };

  // 🖱️ Clique fora fecha dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring transition-all",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Tags */}
      {value.map((tag) => (
        <span
          key={tag.id ?? tag.label}
          className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm"
        >
          {tag.label}
          <button
            type="button"
            onClick={() => removeTag(tag.label)}
            className="ml-1 text-primary/70 hover:text-primary focus:outline-none"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {/* Input */}
      {(!maxTags || value.length < maxTags) && (
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-sm p-0 bg-transparent"
          disabled={disabled}
        />
      )}

      {/* Dropdown de sugestões */}
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute left-0 top-full mt-1 w-full z-50 rounded-md border bg-popover shadow-md animate-in fade-in slide-in-from-top-1">
          {loading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Buscando...
            </li>
          ) : (
            suggestions.map((sug) => (
              <li
                key={sug.id ?? sug.label}
                onClick={() => addTag(sug)}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <span>{sug.label}</span>
                <Plus className="h-4 w-4 opacity-70" />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
